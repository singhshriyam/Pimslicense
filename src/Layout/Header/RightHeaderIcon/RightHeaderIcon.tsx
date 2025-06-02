import { Col } from 'reactstrap'
import ResponsiveSearchInput from './ResponsiveSearchInput/ResponsiveSearchInput'
import ZoomInOut from './ZoomInOut/ZoomInOut'
import Notifications from './Notifications/Notifications'
import DarkMode from './DarkMode/DarkMode'
import HeaderMessage from './HeaderMessage/HeaderMessage'
import HeaderCart from './HeaderCart/HeaderCart'
import UserProfile from './UserProfile/UserProfile'
import Language from './Language/Language'
import HeaderBookmark from './HeaderBookmark'

const RightHeaderIcon = () => {
  return (
    <Col xxl={7} xl={8} className="nav-right col-auto box-col-6 pull-right right-header p-0 ms-auto">
      <ul className="nav-menus">
        <ResponsiveSearchInput />
        <Language />
        <ZoomInOut />
        <Notifications />
        <HeaderBookmark />
        <DarkMode />
        <HeaderMessage />
        <HeaderCart />
        <UserProfile />
      </ul>
    </Col>
  )
}
export default RightHeaderIcon