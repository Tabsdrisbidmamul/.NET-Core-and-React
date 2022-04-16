using Application.Activities;


var builder = WebApplication.CreateBuilder(args);

// add services to container
builder.Services.AddControllers(opt => 
{
  var policy = new AuthorizationPolicyBuilder()
    .RequireAuthenticatedUser()
    .Build();
  
  opt.Filters.Add(new AuthorizeFilter(policy));
  
}).AddFluentValidation(config => 
{
  config.RegisterValidatorsFromAssemblyContaining<Create>();
});
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);


var app = builder.Build();

// configure the http request pipeline
app.UseMiddleware<ExceptionMiddleware>();

app.UseXContentTypeOptions();
app.UseReferrerPolicy(opt => opt.NoReferrer());
app.UseXXssProtection(opt => opt.EnabledWithBlockMode());
app.UseXfo(opt => opt.Deny());
app.UseCsp(opt => opt
  .BlockAllMixedContent()
  .StyleSources(s => s.Self().CustomSources(
    "https://fonts.googleapis.com", 
    "sha256-yChqzBduCCi4o4xdbXRXh4U/t1rP4UUUMJt+rB+ylUI="
  ))
  .FontSources(s => s.Self().CustomSources(
    "https://fonts.gstatic.com", "data:"))
  .FormActions(s => s.Self())
  .FrameAncestors(s => s.Self())
  .ImageSources(s => s.Self().CustomSources(
    "https://res.cloudinary.com",
    "https://www.facebook.com",
    "https://platform-lookaside.fbsbx.com",
    "data:"
  ))
  .ScriptSources(s => s.Self().CustomSources(
    "sha256-pMVxQwJ2pH0ERhq9DYkoMfT656gHkKfxeZuz7bHiqwo=",
    "https://connect.facebook.net",
    "sha256-vWzkDNYU8tou+6JriVmTzxKPVaVbKbzKGI+OgYDsZOo="
  ))
  
);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1"));
}
else
{
  app.Use(async (context, next) =>
  {
    context.Response.Headers.Add(
      "Strict-Transport-Security", "max-age=31536000");
    await next.Invoke();
  });
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("CorsPolicy");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/chat");
app.MapFallbackToController("Index", "Fallback");

using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;

try
{
      var context = services.GetRequiredService<DataContext>();
      var userManager = services.GetRequiredService<UserManager<AppUser>>();
      await context.Database.MigrateAsync();
      await Seed.SeedData(context, userManager);
}
catch (Exception e)
{
      var logger = services.GetRequiredService<ILogger<Program>>();
      logger.LogError(e, "An error occurred during migration");
}

await app.RunAsync();

