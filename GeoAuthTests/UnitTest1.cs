namespace GeoAuthTests;

public class UnitTest1
{
   
    [Fact]
    public void Test1()
    {
        var controller = new HomeController();
        // Act
        var result = await controller.Index();
    }
}