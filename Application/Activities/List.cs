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
      public class Query: IRequest<Result<List<ActivityDTO>>> 
      {
      }

    public class Handler : IRequestHandler<Query, Result<List<ActivityDTO>>>
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

      public async Task<Result<List<ActivityDTO>>> Handle(Query request, CancellationToken cancellationToken)
      {
        var activities = await _context.Activities
          .ProjectTo<ActivityDTO>(
              _mapper.ConfigurationProvider, 
              new { currentUsername =  _userAccessor.GetUserName()})
          .ToListAsync();
          
        return Result<List<ActivityDTO>>.Success(activities);
      }
    }

  }
}