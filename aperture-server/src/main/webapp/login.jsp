<%--
Copyright (c) 2013 Oculus Info Inc. 
http://www.oculusinfo.com/

Released under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
  --%>
<%@ page import="org.apache.shiro.SecurityUtils" %>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>

<html>
<body>

<shiro:notAuthenticated>

	<%
	if( request.getAttribute("shiroLoginFailure") != null ) {
	%>
		<p><b>Bad username or password, try again.</b></p>
	<%} else {%>
    	<p>You must log in. (use <i>admin:admin</i>)</p>
    <%} %>

    <form action="" method="post">
    <table align="left" border="0" cellspacing="0" cellpadding="3">
        <tr>
            <td>Username:</td>
            <td><input type="text" name="username" maxlength="30"></td>
        </tr>
        <tr>
            <td>Password:</td>
            <td><input type="password" name="password" maxlength="30"></td>
        </tr>
        <tr>
            <td colspan="2" align="left"><input type="checkbox" name="rememberMe"><font size="2">Remember Me</font></td>
        </tr>
        <tr>
            <td colspan="2" align="right"><input type="submit" name="submit" value="Login"></td>
        </tr>
    </table>
	</form>

</shiro:notAuthenticated>

<shiro:authenticated>
<p>Hello, <shiro:principal/>.  <a href="logout">Log out</a></p>
</shiro:authenticated>

</body>
</html>
