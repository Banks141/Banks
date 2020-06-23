import React, { useEffect } from 'react'
import AppBar from '@material-ui/core/AppBar'
import CssBaseline from '@material-ui/core/CssBaseline'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import {
  Button,
  createStyles,
  LinearProgress,
  makeStyles,
  Menu,
  MenuItem,
  Theme,
  useMediaQuery
} from '@material-ui/core'
import { SideMenu } from './SideMenu'
import Link from 'next/link'
import { AccountCircle } from '@material-ui/icons'
import CreateIcon from '@material-ui/icons/Create'
import theme from '../../src/theme'
import Router, { useRouter } from 'next/router'
import { useLogout, useViewer } from '../../src/services/UserHooks'
import { SearchBar } from './SearchBar'
import { isServer } from '../../src/utils/environment'
import { ExitIntentDialog, ExitIntentDialogSkipPaths } from '../dialogs/ExitIntentDialog'

const drawerWidth = 240

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexGrow: 1,
    },
    appBar: {
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    toolbar: theme.mixins.toolbar as any,
    title: {
      display: 'none',
      flexGrow: 1,
      [theme.breakpoints.up('sm')]: {
        display: 'inherit',
      },
    },
    content: {
      flexGrow: 1,
    },
    contentPadding: {
      padding: theme.spacing(3),
    },
    siteNameLink: {
      color: theme.palette.text.primary,
      '&:hover': {
        textDecoration: 'none'
      }
    },
  }),
)

interface Props {
  children: JSX.Element[] | JSX.Element
  noPadding?: boolean
}

export function Layout (props: Props) {
  const classes = useStyles()
  const { noPadding } = props
  const { viewer, setViewer } = useViewer()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [loadingRoute, setLoadingRoute] = React.useState(false)
  const [exitIntentDialogOpen, setExitIntentDialogOpen] = React.useState(false)
  const [logout] = useLogout()
  const router = useRouter()

  const smDown = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    const routeLoadingCallback = () => setLoadingRoute(true)
    const routeNotLoadingCallback = () => setLoadingRoute(false)
    Router.events.on('routeChangeStart', routeLoadingCallback)
    Router.events.on('routeChangeComplete', routeNotLoadingCallback)
    Router.events.on('routeChangeError', routeNotLoadingCallback)

    let removeExitIntent: () => void | undefined
    ;(async () => {
      if (!isServer && !viewer?.id && !ExitIntentDialogSkipPaths.includes(router.pathname)) {
        const exitIntent = require('exit-intent').default
        removeExitIntent = exitIntent({
          eventThrottle: 3000,
          onExitIntent: () => {
            setExitIntentDialogOpen(true)
          },
        })
      }
    })()

    return () => {
      Router.events.off('routeChangeStart', routeLoadingCallback)
      Router.events.off('routeChangeComplete', routeNotLoadingCallback)
      Router.events.off('routeChangeError', routeNotLoadingCallback)
      removeExitIntent?.()
    }
  }, [])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    setAnchorEl(e.currentTarget)
  }

  const handleUserMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProfileClick = async () => {
    handleUserMenuClose()
    await Router.push('/users/[username]', `/users/${viewer?.username}`)
  }

  const handleSettingsClick = async () => {
    handleUserMenuClose()
    await Router.push('/settings')
  }

  const handleLogoutClick = async () => {
    handleUserMenuClose()
    await logout()
    setViewer(null)
    await Router.reload()
  }

  const getUserMenu = () => {
    return (
      <div>
        <Link href="/new-post">
          {
            smDown ?
              <IconButton
                aria-label="write a post"
                aria-controls="menu-appbar"
                color="default"><CreateIcon/></IconButton> :
              <Button variant="contained" color="default" startIcon={<CreateIcon/>}>
                Write post
              </Button>
          }
        </Link>

        <IconButton
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleUserMenuOpen}
          color="inherit"
        >
          <AccountCircle/>
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}>
          <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
          <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
          <MenuItem onClick={handleLogoutClick}>Logout</MenuItem>
        </Menu>
      </div>
    )
  }

  const getGuestMenu = () => {
    return (
      <>
        <Link href="/login">
          <Button color="inherit">Login</Button>
        </Link>
        <Link href="/register">
          <Button color="inherit">Register</Button>
        </Link>
      </>
    )
  }

  return (
    <div className={classes.root}>
      <CssBaseline/>
      <AppBar position="fixed" className={classes.appBar} color="default">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}>
            <MenuIcon/>
          </IconButton>
          <Typography variant="h6" noWrap className={classes.title}>
            <Link href="/">
              <a className={classes.siteNameLink}>
                FinSharing.com
              </a>
            </Link>
          </Typography>

          <SearchBar/>

          {
            !!viewer?.id ? getUserMenu() : getGuestMenu()
          }

        </Toolbar>
        {
          loadingRoute ? <LinearProgress/> : ''
        }
      </AppBar>
      <SideMenu onDrawerToggle={handleDrawerToggle} open={mobileOpen}/>
      <main className={`${classes.content} ${noPadding ? '' : classes.contentPadding}`}>
        <div className={classes.toolbar}/>
        {props.children}
      </main>

      <ExitIntentDialog open={exitIntentDialogOpen && !viewer?.id}
                        onClose={() => setExitIntentDialogOpen(false)}/>
    </div>
  )
}
