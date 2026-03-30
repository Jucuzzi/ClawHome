import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// 路由到权限key的映射
const routePermissions = {
  '/dashboard': 'dashboard',
  '/filemanager': 'filemanager',
  '/dailyreport': 'dailyreport',
  '/training': 'training',
  '/chat': 'chat',
  '/learning': 'learning',
  '/permission': 'permission',
  '/role': 'role',
};

function ProtectedRoute({ children, requireAdmin = false }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const location = useLocation();

  // 检查是否登录
  if (!user) {
    // 保存当前路径，登录后跳转回来
    sessionStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // 检查是否需要管理员权限
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // 检查用户是否有权限访问当前路由
  const currentPath = location.pathname;
  const requiredPermission = routePermissions[currentPath];
  
  if (requiredPermission) {
    // 超级管理员可以访问所有路由
    if (user.role === 'admin') {
      return children;
    }
    
    // 检查用户权限列表
    const userPermissions = user.permissions || [];
    
    // 游客默认只能访问学习记录
    if (user.role === 'guest') {
      if (currentPath !== '/learning') {
        return <Navigate to="/learning" replace />;
      }
      return children;
    }
    
    // 其他角色检查权限列表
    if (!userPermissions.includes(requiredPermission)) {
      // 如果没有权限，跳转到用户有权限的第一个页面
      const firstAllowedRoute = userPermissions[0];
      if (firstAllowedRoute) {
        const routePath = Object.keys(routePermissions).find(
          key => routePermissions[key] === firstAllowedRoute
        );
        return <Navigate to={routePath || '/dashboard'} replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
