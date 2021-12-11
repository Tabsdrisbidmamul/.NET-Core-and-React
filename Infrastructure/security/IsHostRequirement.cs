using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.security
{
  public class IsHostRequirement : IAuthorizationRequirement
  {

  }

  public class IsHostRequirementHandler : AuthorizationHandler<IsHostRequirement>
  {
    private readonly DataContext _dataContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public IsHostRequirementHandler(
      DataContext dataContext, IHttpContextAccessor httpContextAccessor)
    {
      this._dataContext = dataContext;
      this._httpContextAccessor = httpContextAccessor;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, IsHostRequirement requirement)
    {
      var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

      if(userId == null) return Task.CompletedTask;

      var activityId = Guid.Parse(
        _httpContextAccessor.HttpContext?.Request.RouteValues
          .SingleOrDefault(x => x.Key == "id").Value?.ToString());

      var attendee = _dataContext.ActivityAttendees
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.AppUserId == userId && x.ActivityId == activityId)
          .Result;

      if(attendee == null) return Task.CompletedTask;

      if (attendee.IsHost) context.Succeed(requirement);

      return Task.CompletedTask;
    }
  }
}