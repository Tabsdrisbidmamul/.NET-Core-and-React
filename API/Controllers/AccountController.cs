using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using API.DTOs;
using API.Services;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace API.Controllers
{
  [AllowAnonymous]
  [ApiController]
  [Route("/api/[controller]")]
  public class AccountController : ControllerBase
  {
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly TokenService _tokenService;
    public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, TokenService tokenService)
    {
      _tokenService = tokenService;
      _signInManager = signInManager;
      _userManager = userManager;
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
    {
      var user = await _userManager.FindByEmailAsync(loginDto.Email);

      if (user == null) return Unauthorized();

      var result = 
        _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false).Result;

      if(result.Succeeded)
      {
        return CreateUserObject(user);
      }

      return Unauthorized();
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
    {
      if(await _userManager.Users.AnyAsync(x => x.Email == registerDto.Email))
      {
        return BadRequest("Email taken");
      }

      if(await _userManager.Users.AnyAsync(x => x.UserName == registerDto.Username))
      {
        return BadRequest("UserName taken");
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
        return CreateUserObject(user);
      }

      return BadRequest("Problem register user");

    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
      var user = 
        await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

      if(user == null) 
      {
        return Unauthorized();
      }

      return CreateUserObject(user);
    }

    private UserDto CreateUserObject(AppUser user)
    {
      return new UserDto
      {
          DisplayName = user.DisplayName,
          Image = null,
          Username = user.UserName,
          Token = _tokenService.CreateToken(user)
       };
    }

  }
}