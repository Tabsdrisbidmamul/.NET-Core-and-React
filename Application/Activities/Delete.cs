using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using MediatR;
using Persistence;

namespace Application.Activities
{
    public class Delete
    {
        public class Command: IRequest<Result<Unit>>
        {
          public Guid Id { get; set;}
        }

    public class Handler : IRequestHandler<Command, Result<Unit>>
    {
      private readonly DataContext _context;

      public Handler(DataContext context)
      {
        _context = context;
      }

      public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
      {
        var activity = await _context.Activities.FindAsync(request.Id);
        
        // if(activity == null) return null;

        _context.Activities.Remove(activity);
        var result = await _context.SaveChangesAsync() > 0; // >0: changes saved to db

        if(!result) return Result<Unit>.Failure("Failed to delete the activity");
        
        return Result<Unit>.Success(Unit.Value);
      }
    }
  }
}