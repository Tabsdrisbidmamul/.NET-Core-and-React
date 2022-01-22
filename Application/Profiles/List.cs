using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Profiles
{
    public class List
    {
      public class Query: IRequest<Result<List<UserActivityDTO>>>
      {
        public string Username { get; set; }
        public string Predicate { get; set; } = "future";
      }

    public class Handler : IRequestHandler<Query, Result<List<UserActivityDTO>>>
    {
      private readonly DataContext _context;
      private readonly IMapper _mapper;
      public Handler(DataContext context, IMapper mapper)
      {
        _mapper = mapper;
        _context = context;
      }

      public async Task<Result<List<UserActivityDTO>>> Handle(Query request, CancellationToken cancellationToken)
      {
        var query = _context.Activities
          .Where(a => a.Attendees.Any(u => u.AppUser.UserName == request.Username))
          .OrderBy(d => d.Date)
          .ProjectTo<UserActivityDTO>(_mapper.ConfigurationProvider)
          .AsQueryable();

        if(query == null) return null;

        if(request.Predicate == "past") 
        {
          query = query
            .Where(a => a.Date <= DateTime.Now);
        }

        if(request.Predicate == "future")
        {
          query = query
            .Where(a => a.Date >= DateTime.Now);
        }

        if(request.Predicate == "hosting")
        {
          query = query
            .Where(a => a.HostUsername == request.Username);
        }

        var activities = await query.ToListAsync();

        return Result<List<UserActivityDTO>>.Success(activities);
      }
    }
  }
}