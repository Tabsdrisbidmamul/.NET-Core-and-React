using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Activities.Core;
using Application.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Followers
{
  public class List
  {
    public class Query: IRequest<Result<List<Profiles.Profile>>>
    {
      public string Predicate { get; set; }
      public string Username { get; set; }
    }

    public class Handler : IRequestHandler<Query, Result<List<Profiles.Profile>>>
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

      public async Task<Result<List<Profiles.Profile>>> Handle(Query request, CancellationToken cancellationToken)
      {
        var profiles = new List<Profiles.Profile>();
        
        var user = await _context.Users
          .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

        switch(request.Predicate)
        {
          case "followers":
            profiles = await _context.UserFollowings
              .Where(x => x.Target.UserName == request.Username)
              .Select(x => x.Observer)
              .ProjectTo<Profiles.Profile>(
                  _mapper.ConfigurationProvider,
                  new { currentUsername = _userAccessor.GetUserName()})
              .ToListAsync();
            break;
          case "following":
            profiles = await _context.UserFollowings
              .Where(x => x.Observer.UserName == request.Username)
              .Select(x => x.Target)
              .ProjectTo<Profiles.Profile>(
                  _mapper.ConfigurationProvider,
                  new { currentUsername = _userAccessor.GetUserName()})
              .ToListAsync();
            break;
        }

        return Result<List<Profiles.Profile>>.Success(profiles);
      }
    }
  }
}