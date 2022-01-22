using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Application.Profiles
{
    public class UserActivityDTO
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Property { get; set; }
        public DateTime Date { get; set; }
        [JsonIgnore]
        public string HostUsername { get; set; }
    }
}