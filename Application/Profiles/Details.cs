namespace Application.Profiles;

public class Details
{
    public class Query: IRequest<Result<Profile>>
    {
      public string Username { get; set; }
    }

  public class Handler : IRequestHandler<Query, Result<Profile>>
  {
    private readonly DataContext _context;
    private readonly IMapper _mapper;
    private readonly IUserAccessor _userAccessor;

    public Handler(DataContext context, IMapper mapper, IUserAccessor userAccessor)
    {
      _userAccessor = userAccessor;
      _context = context;
      _mapper = mapper;
    }

    public async Task<Result<Profile>> Handle(Query request, CancellationToken cancellationToken)
    {
      var user = await _context.Users
        .ProjectTo<Profile>(
          _mapper.ConfigurationProvider,
          new {currentUsername = _userAccessor.GetUserName()})
        .FirstOrDefaultAsync(x => x.Username == request.Username);

      return Result<Profile>.Success(user);
    }
  }
}
