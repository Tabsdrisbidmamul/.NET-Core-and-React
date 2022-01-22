using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Profiles;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ProfilesController: BaseApiController
    {

      [HttpGet("{username}")]
      public async Task<IActionResult> GetProfile(string username)
      {
        return HandleResult(await Mediator.Send(new Details.Query{Username = username}));
      }

      [HttpGet("{username}/activities")]
      public async Task<IActionResult> GetUserActivity(string username, string predicate)
      {
        return HandleResult(await Mediator.Send(new List.Query{Username = username, Predicate = predicate}));
      }

      [HttpPut]
      public async Task<IActionResult> UpdateProfile(Profile profile)
      {
        return HandleResult(await Mediator.Send(new Edit.Command{Profile = profile}));
      }
        
    }
}