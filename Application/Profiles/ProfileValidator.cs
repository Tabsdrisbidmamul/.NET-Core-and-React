using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentValidation;

namespace Application.Profiles
{
  public class ProfileValidator : AbstractValidator<Profile>
  {
    public ProfileValidator()
    {
      RuleFor(x => x.DisplayName).NotEmpty();
      
    }
  }
}