import React, { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | { pathname?: string; query?: Record<string, string> }
  as?: string
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  prefetch?: boolean
  legacyBehavior?: boolean
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  props,
  ref
) {
  const {
    href,
    replace,
    scroll: _s,
    shallow: _sh,
    passHref: _ph,
    prefetch: _pf,
    legacyBehavior: _lb,
    children,
    ...rest
  } = props
  void _s
  void _sh
  void _ph
  void _pf
  void _lb
  const target = typeof href === 'string' ? href : href.pathname || '/'

  // 外部链接或锚点链接，使用原生 <a>
  const isExternal =
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('//') ||
    target.startsWith('mailto:') ||
    target.startsWith('tel:')

  if (isExternal) {
    return (
      <a ref={ref} href={target} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <RouterLink
      ref={ref}
      to={target}
      replace={replace}
      {...rest}
    >
      {children}
    </RouterLink>
  )
})

export default Link
