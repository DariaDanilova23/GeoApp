using Xunit;
using GeoAuth;
using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GeoAuth.Data;
using GeoAuth.Controllers;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
//using System.Dynamic;
using System.IO;
using Microsoft.AspNetCore.Http;
using Moq;
using Microsoft.EntityFrameworkCore;

namespace GeoAuth.Tests.Services;

public class ServiceTests
{
    // HomeController home;
    //public readonly UserManager<IdentityUser> _userManager;
    /*  public UserServiceTests()
      {
          HomeController obj= new HomeController(null);
          var res=obj.Index() as ViewResult;
          Assert.Equal("Index",res.ViewName);
         // home.userManager=_userManager;
        //  home.Index();
        //_userManager=userManager;
      }
  */

    [Fact]
    public void HomeTest()
    {
        var store = new Moq.Mock<IUserStore<IdentityUser>>();
        store.Setup(x => x.FindByIdAsync("bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d", CancellationToken.None))
            .ReturnsAsync(new IdentityUser()
            {
                UserName = "111@11.ru",
                Id = "bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d"
            });

        var mgr = new UserManager<IdentityUser>(store.Object, null, null, null, null, null, null, null, null);
        HomeController objHome = new HomeController(mgr);
        Assert.NotNull(objHome);
    }

    [Fact]
    public void ShapeTest()
    {
        ShapeController obj = new ShapeController();
        var res = obj.Index() as ViewResult;
        Assert.Equal("Index", res?.ViewName);
    }

    [Fact]
    public void AddShapeFile()
    {
        ShapeController obj = new ShapeController();

        var filePath = "C:/Users/dddan/GeoApp/GeoAuth.Tests/Services/91_3.shp";
        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        var formFile = new Microsoft.AspNetCore.Http.FormFile(stream, 0, stream.Length, null, "test");
        var t = obj.AddFile(formFile);
        //Assert.NotEmpty(t);
    }

    protected readonly ApplicationDbContext _context;
    [Fact]
   public void AdminTest()
    {

        var store = new Moq.Mock<IUserStore<IdentityUser>>();
        store.Setup(x => x.FindByIdAsync("bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d", CancellationToken.None))
            .ReturnsAsync(new IdentityUser()
            {
                UserName = "111@11.ru",
                Id = "bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d"
            });

        var mgr = new UserManager<IdentityUser>(store.Object, null, null, null, null, null, null, null, null);
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var context = new Mock<ApplicationDbContext>(optionsBuilder.Options);
        AdminController obj = new AdminController(mgr, context.Object);
    }

    
    [Fact]
    public void ManageUserTest()
    {
        var store = new Moq.Mock<IUserStore<IdentityUser>>();
        store.Setup(x => x.FindByIdAsync("bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d", CancellationToken.None))
            .ReturnsAsync(new IdentityUser()
            {
                UserName = "111@11.ru",
                Id = "bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d"
            });

        var mgr = new UserManager<IdentityUser>(store.Object, null, null, null, null, null, null, null, null);
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var context = new Mock<ApplicationDbContext>(optionsBuilder.Options);
      AdminController obj = new AdminController(mgr, context.Object);
      var t = obj.ManageUserRoles("bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d");
    }


    [Fact]
     public void DelteUserTest()
    {
        var store = new Moq.Mock<IUserStore<IdentityUser>>();
        store.Setup(x => x.FindByIdAsync("bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d", CancellationToken.None))
            .ReturnsAsync(new IdentityUser()
            {
                UserName = "111@11.ru",
                Id = "bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d"
            });

        var mgr = new UserManager<IdentityUser>(store.Object, null, null, null, null, null, null, null, null);
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var context = new Mock<ApplicationDbContext>(optionsBuilder.Options);
      AdminController obj = new AdminController(mgr, context.Object);
      var t = obj.DeleteUser("bb4fc4ab-a1c4-465d-8be6-7e88fb1ef01d");
    }
}