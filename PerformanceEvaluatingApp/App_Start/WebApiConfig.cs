using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Routing;
using System.Web.Mvc.Routing.Constraints;
using PerformanceEvaluatingApp.Models;

namespace PerformanceEvaluatingApp
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            config.MapHttpAttributeRoutes();
            //config.Routes.MapHttpRoute(
            //    name: "GetTestWebPages",
            //    routeTemplate: "websites/test/{testId}",
            //    defaults: new
            //    {
            //        controller = "Websites",
            //        action = "GetWebpages"
            //    },
            //    constraints: new
            //    {
            //        httpMethod = new HttpMethodConstraint(HttpMethod.Get),
            //        testId = new IntRouteConstraint()
            //    }
            //);
            //config.Routes.MapHttpRoute(
            //    name: "GetAllWebpages",
            //    routeTemplate: "websites/{websiteId}/all",
            //    defaults: new { controller = "Websites", action = "GetAllWebpages" },
            //    constraints: new
            //    {
            //        httpMethod = new HttpMethodConstraint(HttpMethod.Get),
            //        websiteId = new IntRouteConstraint()
            //    }
            //);
            //config.Routes.MapHttpRoute(
            //    name: "DefaultApi",
            //    routeTemplate: "websites/{value}",
            //    defaults: new
            //    {
            //        controller = "Websites",
            //        value = RouteParameter.Optional
            //    }
            //);
        }
    }
}
