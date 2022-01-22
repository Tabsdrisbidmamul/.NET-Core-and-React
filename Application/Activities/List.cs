using System;
using System.Collections.Generic;
using System.Linq;
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
    public class List
    {
      public class Query: IRequest<Result<PagedLists<ActivityDTO>>> 
      {
        public ActivityParams Params { get; set; }
      }

    public class Handler : IRequestHandler<Query, Result<PagedLists<ActivityDTO>>>
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

      public async Task<Result<PagedLists<ActivityDTO>>> Handle(Query request, CancellationToken cancellationToken)
      {
        var query = _context.Activities
          .Where(d => d.Date >= request.Params.StartDate)
          .OrderBy(d => d.Date)
          .ProjectTo<ActivityDTO>(
              _mapper.ConfigurationProvider, 
              new { currentUsername =  _userAccessor.GetUserName()})
          .AsQueryable();
        
        if(request.Params.IsGoing && !request.Params.IsHost)
        {
          query = query
            .Where(x => x.Attendees.Any(a => a.Username == _userAccessor.GetUserName()));
        }

        if(request.Params.IsHost && !request.Params.IsGoing)
        {
          query = query
            .Where(x => x.HostUsername == _userAccessor.GetUserName());
        }

        
          
        return Result<PagedLists<ActivityDTO>>.Success(
          await PagedLists<ActivityDTO>.CreateAsync(
            query, 
            request.Params.PageNumber, 
            request.Params.PageSize)
        );
      }
    }

  }
}