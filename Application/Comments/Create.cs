using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using Application.Interfaces;
using AutoMapper;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Comments
{
    public class Create
    {
      public class Command: IRequest<Result<CommentDTO>>
      {
        public string Body { get; set; }
        public Guid ActivityId { get; set; }

      }

      public class CommandValidator : AbstractValidator<Command>
      {
        public CommandValidator()
        {
          RuleFor(x => x.Body).NotEmpty();
        }
      }

      public class Handler : IRequestHandler<Command, Result<CommentDTO>>
      {
        private readonly DataContext _context;
        private readonly IUserAccessor _userAccessor;
        private readonly IMapper _mapper;

        public Handler(DataContext context, IUserAccessor userAccessor, IMapper mapper)
        {
          _userAccessor = userAccessor;
          _mapper = mapper;
          _context = context;
          
        }

        public async Task<Result<CommentDTO>> Handle(Command request, CancellationToken cancellationToken)
        {
          var user = await _context.Users
            .Include(p => p.Photos)
            .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());
          
          if(user == null) return null;

          var activity = await _context.Activities.FindAsync(request.ActivityId);
          
          if(activity == null) return null;

          var comment = new Comment
          {
            Author = user,
            Activity = activity,
            Body = request.Body
          };

          activity.Comments.Add(comment);

          var success = await _context.SaveChangesAsync() > 0;

          if(success) return Result<CommentDTO>.Success(_mapper.Map<CommentDTO>(comment));

          return Result<CommentDTO>.Failure("Failed to add comment");

        }
      }
  }
}