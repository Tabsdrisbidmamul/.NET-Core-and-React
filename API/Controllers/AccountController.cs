using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using API.DTOs;
using API.Services;
using Application.Interfaces;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace API.Controllers
{
  [ApiController]
  [Route("/api/[controller]")]
  public class AccountController : ControllerBase
  {
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly TokenService _tokenService;
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;
    private readonly IEmailSender _emailSender;

    public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, TokenService tokenService, IConfiguration config, IEmailSender emailSender)
    {
      _emailSender = emailSender;
      _tokenService = tokenService;
      _config = config;
      _signInManager = signInManager;
      _userManager = userManager;
      _httpClient = new HttpClient
      {
        BaseAddress = new System.Uri("https://graph.facebook.com")
      };
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
      var user = await _userManager.Users.Include(p => p.Photos)
        .FirstOrDefaultAsync(x => x.Email == loginDto.Email);

      if (user == null) return Unauthorized("Invalid Email");

      if(user.UserName == "bob") user.EmailConfirmed = true; // TODO: Remove In Prod

      if(!user.EmailConfirmed) return Unauthorized("Email not confirmed");

      var result = 
        _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false).Result;

      if(result.Succeeded)
      {
        await SetRefreshToken(user);
        return CreateUserObject(user);
      }

      return Unauthorized("Invalid Password");
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
    {
      if(await _userManager.Users.AnyAsync(x => x.Email == registerDto.Email))
      {
        ModelState.AddModelError("email", "Email taken");
        return ValidationProblem(ModelState);
      }

      if(await _userManager.Users.AnyAsync(x => x.UserName == registerDto.Username))
      {
        ModelState.AddModelError("username", "Username taken");
        return ValidationProblem(ModelState);
      }

      var user = new AppUser
      {
        DisplayName = registerDto.DisplayName,
        Email = registerDto.Email,
        UserName = registerDto.Username,
      };

      var result = _userManager.CreateAsync(user, registerDto.Password).Result;

      if(!result.Succeeded) return BadRequest("Problem registering user");

      var origin = Request.Headers["origin"];
      var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
      token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

      var verifyUrl = $"{origin}/account/verifyEmail?token={token}&email={user.Email}";

      var message = 
        $"<p>Please click the below link to verify your email address: </p><p><a href=\"{verifyUrl}\">Click to verify email</a></p>";
      
      await _emailSender.SendEmailAsync(user.Email, "Please verify email", message);

      return Ok("Registration success - please verify your email");
    }

    [AllowAnonymous]
    [HttpPost("verifyEmail")]
    public async Task<IActionResult> VerifyEmail(string token, string email)
    {
      var user = await _userManager.FindByEmailAsync(email);
      
      if(user == null) return Unauthorized();

      var decodedTokenBytes = WebEncoders.Base64UrlDecode(token);
      var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

      var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

      if(!result.Succeeded) return BadRequest("Could not verify Email Address");

      return Ok("Email confirmed - you have now logged in");
    }

    [AllowAnonymous]
    [HttpGet("resendEmailConfirmationLink")]
    public async Task<IActionResult> ResendEmailConfirmationLink(string email) 
    {
      var user = await _userManager.FindByEmailAsync(email);
      
      if(user == null) return Unauthorized();

      if(user.EmailConfirmed) return BadRequest("Email already confirmed");

      return await GenerateEmailConfirmationEmail(user, "Email Verification link resent");
    }


    [Authorize]
    [HttpGet]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
      var user = 
        await _userManager.Users.Include(p => p.Photos)
          .FirstOrDefaultAsync(x => x.Email == User.FindFirstValue(ClaimTypes.Email));

      if(user == null) 
      {
        return Unauthorized();
      }

      await SetRefreshToken(user);
      return CreateUserObject(user);
    }

    [AllowAnonymous]
    [HttpPost("fbLogin")]
    public async Task<ActionResult<UserDto>> FacebookLogin(string accessToken)
    {
      var fbVerifyKeys = _config["Facebook:AppId"] + "|" + _config["Facebook:AppSecret"];

      var verifyToken = await _httpClient.
        GetAsync($"debug_token?input_token={accessToken}&access_token={fbVerifyKeys}");

      if(!verifyToken.IsSuccessStatusCode) return Unauthorized();

      var fbUrl = 
        $"me?access_token={accessToken}&fields=name,email,picture.width(100).height(100)";
      
      var response = await _httpClient.GetAsync(fbUrl);

      if(!response.IsSuccessStatusCode) return Unauthorized();


      var fbInfo = JsonConvert
        .DeserializeObject<FbDto>(await response.Content.ReadAsStringAsync());

      var username = fbInfo.id;

      var user = await _userManager.Users
        .Include(p => p.Photos).FirstOrDefaultAsync(x => x.UserName == username);
      
      if(user != null) return CreateUserObject(user);

      user = new AppUser
      {
        DisplayName = fbInfo.name,
        Email = fbInfo.email,
        UserName = fbInfo.id,
        Photos = new List<Photo> 
        {
          new Photo {Id = "fb_" + fbInfo.id, Url = fbInfo.picture.data.url, IsMain = true}
        }
      };

      user.EmailConfirmed = true;

      var result = await _userManager.CreateAsync(user);

      if(!result.Succeeded) return BadRequest("Problem creating user account");

      await SetRefreshToken(user);
      return CreateUserObject(user);
      
    }

    [Authorize]
    [HttpPost("refreshToken")]
    public async Task<ActionResult<UserDto>> RefreshToken()
    {
      var refreshToken = Request.Cookies["refreshToken"];
      var user = await _userManager.Users
        .Include(p => p.Photos)
        .Include(r => r.RefreshToken)
        .FirstOrDefaultAsync(x => x.UserName == User.FindFirstValue(ClaimTypes.Name));
      
      if(user == null) return Unauthorized();

      var oldToken = user.RefreshToken.SingleOrDefault(x => x.Token == refreshToken);

      if(oldToken != null && !oldToken.IsActive) return Unauthorized();

      return CreateUserObject(user);

    }

    private async Task SetRefreshToken(AppUser user)
    {
      var refreshToken = _tokenService.CreateRefreshToken();
      user.RefreshToken.Add(refreshToken);

      await _userManager.UpdateAsync(user);

      var cookieOptions = new CookieOptions
      {
        HttpOnly = true,
        Expires = DateTime.UtcNow.AddDays(7)
      };

      Response.Cookies.Append("refreshToken", refreshToken.Token, cookieOptions);
    }

    private UserDto CreateUserObject(AppUser user)
    {
      return new UserDto
      {
          DisplayName = user.DisplayName,
          Image = user?.Photos?.FirstOrDefault(x => x.IsMain)?.Url,
          Username = user.UserName,
          Token = _tokenService.CreateToken(user)
       };
    }

    private async Task<IActionResult> GenerateEmailConfirmationEmail(AppUser user, string msg) 
    {
      var origin = Request.Headers["origin"];
      var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
      token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

      var verifyUrl = $"{origin}/account/verifyEmail?token={token}&email={user.Email}";

      var message = 
        $"<p>Please click the below link to verify your email address: </p><p><a href=\"{verifyUrl}\">Click to verify email</a></p>";
      
      await _emailSender.SendEmailAsync(user.Email, "Please verify email", message);

      return Ok(msg);
    }
  }
}