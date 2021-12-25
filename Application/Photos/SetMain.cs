using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
    public class SetMain
    {

      public class Command: IRequest<Result<Unit>>
      {
        public string Id { get; set; }
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
        var user = await _context.Users.Include(p => p.Photos)
          .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());
        
        if(user == null) return null;

        var photo = user.Photos.FirstOrDefault(x => x.Id == request.Id);

        if(photo == null) return null;

        var currentMain = user.Photos.FirstOrDefault(x => x.IsMain);

        // Switch the IsMain flag on the current and new photo
        if(currentMain != null) currentMain.IsMain = false;
        photo.IsMain = true;

        var result = await _context.SaveChangesAsync() > 0;

        if(result) return Result<Unit>.Success(Unit.Value);

        return Result<Unit>.Failure("Cannot update photo to be main photo");

      }
    }

  }
}