using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;

namespace PerformanceEvaluatingApp.Models
{
    public class WebsitesContext : DbContext
    {
        public DbSet<WebPage> WebPages { get; set; }
        public DbSet<Website> Websites { get; set; }
        public WebsitesContext()
        {
            Configuration.LazyLoadingEnabled = true;
        }
    }
}