using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using API.DTOs;
using API.Services;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

    public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, TokenService tokenService, IConfiguration config)
    {
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

      if (user == null) return Unauthorized();

      var result = 
        _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false).Result;

      if(result.Succeeded)
      {
        await SetRefreshToken(user);
        return CreateUserObject(user);
      }

      return Unauthorized();
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

      if(result.Succeeded)
      {
        await SetRefreshToken(user);
        return CreateUserObject(user);
      }

      return BadRequest("Problem register user");

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

  }
}