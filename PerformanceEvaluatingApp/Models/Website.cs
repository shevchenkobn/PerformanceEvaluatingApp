using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PerformanceEvaluatingApp.Models
{
    public class Website
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public ICollection<WebPage> WebPages { get; set; }

        public Website()
        {
            WebPages = new List<WebPage>();
        }
    }
}