using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using Application.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Profiles
{
  public class Edit
  {
    public class Command: IRequest<Result<Unit>> 
    {
      public Profile Profile {get; set;}
    }

    public class CommandValidator : AbstractValidator<Command>
    {
      public CommandValidator()
      {
        RuleFor(x => x.Profile).SetValidator(new ProfileValidator());
      }
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
        var user = await _context.Users
          .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

        if(user == null) return null;

        if(request.Profile.DisplayName != null) 
        {
          user.DisplayName = request.Profile.DisplayName;
        }

        if(request.Profile.Bio != null) 
        {
          user.Bio = request.Profile.Bio;
        }

        _context.Entry(user).State = EntityState.Modified;

        var result = await _context.SaveChangesAsync() > 0;

        if(result)
        {
          return Result<Unit>.Success(Unit.Value);
        }

        return Result<Unit>.Failure("Could not update user profile");
      }
    }
  }
}