using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace PerformanceEvaluatingApp.Models
{
    /// <summary>
    /// Class needed just to get 20 columns in database
    /// </summary>
    public class HttpStatusCode
    {
        [Key]
        public int Code { get; set; }
        public string Phrase { get; set; }
    }
}