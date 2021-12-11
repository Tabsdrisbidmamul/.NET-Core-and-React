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

namespace Application.Activities
{
    public class UpdateAttendance
    {
        public class Command: IRequest<Result<Unit>>
        {
          public Guid Id { get; set; }
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
        var activity = await _context.Activities
          .Include(a => a.Attendees)
          .ThenInclude(u => u.AppUser)
          .FirstOrDefaultAsync(x => x.Id == request.Id);

        if(activity == null) return null;

        var user = await _context.Users
          .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

        if(user == null) return null;

        var hostUsername = activity.Attendees
          .FirstOrDefault(x => x.IsHost)?.AppUser?.UserName;

        // Get the ActivityAttendee obj for the user that sent the request:
        // a) Get the Host ActivityAttendee obj
        // b) Get the Non-Host User ActivityAttendee obj
        // c) Will return null, meaning that the user is signing up to go to the event 
        var attendance = activity.Attendees
          .FirstOrDefault(x => x.AppUser.UserName == user.UserName);
        
        // Host sending request, and wants to either cancel or uncancel event
        if(attendance != null && hostUsername == user.UserName)
        {
          activity.IsCancelled = !activity.IsCancelled;
        }

        // Not host user, but attendee and does not want to go to the event
        if(attendance != null && hostUsername != user.UserName)
        {
          activity.Attendees.Remove(attendance);
        }

        // New user that wants to go to event
        if(attendance == null)
        {
          attendance = new ActivityAttendee 
          {
            AppUser = user,
            Activity = activity,
            IsHost = false
          };

          activity.Attendees.Add(attendance);
        }

        var result = await _context.SaveChangesAsync() > 0; // >0: written to db


        return result 
          ? Result<Unit>.Success(Unit.Value) 
          : Result<Unit>.Failure("Problem updating attendance");
      }
    }
  }
}