// @ts-ignore;
import React from 'react';

/**
 * 错误边界类组件
 * 用于捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMsg: ''
    };
    // 绑定方法到实例
    this.handleReset = this.handleReset.bind(this);
  }

  /**
   * 更新错误状态
   * @param {Error} error - 捕获的错误对象
   * @returns {Object} 更新的状态
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMsg: error.message || '未知错误'
    };
  }

  /**
   * 记录错误日志
   * @param {Error} error - 捕获的错误对象
   * @param {Object} errorInfo - 错误信息对象
   */
  componentDidCatch(error, errorInfo) {
    // 记录错误日志到控制台
    console.error('ErrorBoundary 捕获到错误:', error);
    console.error('错误信息:', errorInfo);

    // 可以在这里将错误信息上报到日志服务
    // 例如：logErrorToService(error, errorInfo);
  }

  /**
   * 重置错误状态
   */
  handleReset() {
    this.setState({
      hasError: false,
      errorMsg: ''
    });
  }
  render() {
    if (this.state.hasError) {
      return <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 rounded-lg border border-red-200">
          <div className="text-6xl mb-4">😵</div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">组件加载失败</h3>
          <p className="text-sm text-red-600 mb-4 text-center max-w-md">
            错误信息: {this.state.errorMsg}
          </p>
          <button onClick={this.handleReset} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
            刷新组件
          </button>
        </div>;
    }
    return this.props.children;
  }
}

/**
 * 函数组件封装 ErrorBoundary
 * 提供更简洁的使用方式
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 * @returns {JSX.Element} ErrorBoundary 组件
 */
export function ErrorBoundaryWrapper({
  children
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
export default ErrorBoundary;