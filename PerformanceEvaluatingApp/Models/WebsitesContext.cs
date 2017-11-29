using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;

namespace PerformanceEvaluatingApp.Models
{
    public class WebsitesContext : DbContext
    {
        static WebsitesContext()
        {
            Database.SetInitializer(new DbInitializer());
        }
        public DbSet<Website> Websites { get; set; }
        public DbSet<Test> Tests { get; set; }
        public DbSet<IpAddressInfo> IpAddressInfos { get; set; }
        public DbSet<WebPage> WebPages { get; set; }
        public DbSet<HttpStatusCode> HttpStatusCodes { get; set; }
        public WebsitesContext()
        {
            
        }
    }
}