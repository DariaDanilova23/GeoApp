using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using GeoAuth.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;

namespace GeoAuth.Controllers;

public class HomeController : Controller
{
    //private readonly ILogger<HomeController> _logger;
    public readonly UserManager<IdentityUser> _userManager;

    public HomeController(UserManager<IdentityUser> userManager)
    {
        //ILogger<HomeController> logger,
       // _logger = logger;
        _userManager=userManager;
    }

    public IActionResult Index()
    {
       if (_userManager.GetUserId(HttpContext.User)!=null){
        ViewBag.userid=_userManager.GetUserId(HttpContext.User);
        }
        else{
            ViewBag.userid=" ";
        }
        return View("Index");
    }

    public IActionResult Privacy()
    {
        return View();
    }

    

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
