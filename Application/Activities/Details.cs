using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using Application.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
    public class Details
    {
        public class Query: IRequest<Result<ActivityDTO>> 
        {
          public Guid Id {get; set; }

        }

      public class Handler : IRequestHandler<Query, Result<ActivityDTO>>
      {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        private readonly IUserAccessor _userAccessor;

        public Handler(DataContext context, IMapper mapper, IUserAccessor userAccessor)
        {
          _userAccessor = userAccessor;
          _mapper = mapper;
          _context = context;
        }

        public async Task<Result<ActivityDTO>> Handle(Query request, CancellationToken cancellationToken)
        {
          var activity = await _context.Activities
            .ProjectTo<ActivityDTO>(
                _mapper.ConfigurationProvider, 
                new {currentUsername = _userAccessor.GetUserName()})
            .FirstOrDefaultAsync(x => x.Id == request.Id);

          return Result<ActivityDTO>.Success(activity);
        }
      }

  }
}