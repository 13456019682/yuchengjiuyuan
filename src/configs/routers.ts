import BLANK from '../pages/blank.jsx';
import OWNER/HOME from '../pages/owner/home.jsx';
import OWNER/ORDER_CREATE from '../pages/owner/order-create.jsx';
import OWNER/ORDER_LIST from '../pages/owner/order-list.jsx';
import OWNER/ORDER_DETAIL from '../pages/owner/order-detail.jsx';
import OWNER/PROFILE from '../pages/owner/profile.jsx';
import MASTER/SIGNUP from '../pages/master/signup.jsx';
import MASTER/ORDER_WAIT from '../pages/master/order-wait.jsx';
import MASTER/ORDER_DETAIL from '../pages/master/order-detail.jsx';
import ADMIN/EXPORT_CALL-LOGS from '../pages/admin/export-call-logs.jsx';
import TEST/VALIDATION from '../pages/test/validation.jsx';
import TEST/VALIDATION_REPORT from '../pages/test/validation-report.jsx';
import TEST/DEPLOY_GUIDE from '../pages/test/deploy-guide.jsx';
export const routers = [{
  id: "blank",
  component: BLANK
}, {
  id: "owner/home",
  component: OWNER/HOME
}, {
  id: "owner/order-create",
  component: OWNER/ORDER_CREATE
}, {
  id: "owner/order-list",
  component: OWNER/ORDER_LIST
}, {
  id: "owner/order-detail",
  component: OWNER/ORDER_DETAIL
}, {
  id: "owner/profile",
  component: OWNER/PROFILE
}, {
  id: "master/signup",
  component: MASTER/SIGNUP
}, {
  id: "master/order-wait",
  component: MASTER/ORDER_WAIT
}, {
  id: "master/order-detail",
  component: MASTER/ORDER_DETAIL
}, {
  id: "admin/export-call-logs",
  component: ADMIN/EXPORT_CALL-LOGS
}, {
  id: "test/validation",
  component: TEST/VALIDATION
}, {
  id: "test/validation-report",
  component: TEST/VALIDATION_REPORT
}, {
  id: "test/deploy-guide",
  component: TEST/DEPLOY_GUIDE
}]