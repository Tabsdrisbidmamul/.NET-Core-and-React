using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Application.Activities.Core
{
    public class PagedLists<T>: List<T>
    {
        public PagedLists(IEnumerable<T> items, int count, int pageNumber, int pageSize)
        {
          CurrentPage = pageNumber;
          TotalPages = (int)Math.Ceiling(count / (double)pageSize);
          PageSize = pageSize;
          TotalCount = count;
          AddRange(items);
        }
        
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }

        public static async Task<PagedLists<T>> CreateAsync(IQueryable<T> source, int pageNumber, int pageSize)
        {
          var count = await source.CountAsync();
          var items = await source
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
          
          return new PagedLists<T>(items, count, pageNumber, pageSize);

        }
        
    }
}