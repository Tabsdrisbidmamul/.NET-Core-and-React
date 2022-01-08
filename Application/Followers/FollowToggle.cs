using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Followers
{
    public class FollowToggle
    {
      public class Command: IRequest<Result<Unit>>
      {
        public string TargetUsername { get; set; }
      }

      public class Handler : IRequestHandler<Command, Result<Unit>>
      {
        private readonly DataContext _context;
        private readonly IUserAccessor _userAccessor;
        public Handler(DataContext context, IUserAccessor userAccessor)
        {
          _userAccessor = userAccessor;
          _context = context;
        }

      public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
        {
          var observer = await _context.Users
            .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

          if(observer == null) return null;

          var target = await _context.Users
            .FirstOrDefaultAsync(x => x.UserName == request.TargetUsername);
          
          if(target == null) return null;

          var following = await _context.UserFollowings.FindAsync(observer.Id, target.Id);

          if(following == null)
          {
            following = new UserFollowing 
            {
              Observer = observer,
              Target = target
            };

            _context.UserFollowings.Add(following);
          } 
          else
          {
            _context.UserFollowings.Remove(following);
          }

          var savedChanged = await _context.SaveChangesAsync() > 0;

          if(savedChanged)
          {
            return Result<Unit>.Success(Unit.Value);
          }

          return Result<Unit>.Failure("Error occurred when updating followings");

        }
      }

  }
}