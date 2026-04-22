import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface RouterContextType {
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  params: {},
  searchParams: new URLSearchParams(),
  navigate: () => {},
});

function getPath() {
  const hash = window.location.hash;
  if (!hash || hash === '#') return '/';
  const withoutHash = hash.slice(1);
  const [pathname] = withoutHash.split('?');
  return pathname || '/';
}

function getSearch() {
  const hash = window.location.hash;
  if (!hash) return new URLSearchParams();
  const q = hash.indexOf('?');
  if (q === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(q + 1));
}

export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(getPath);
  const [searchParams, setSearchParams] = useState(getSearch);
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    const url = '#' + to;
    if (opts?.replace) {
      window.history.replaceState(null, '', url);
    } else {
      window.history.pushState(null, '', url);
    }
    setPath(getPath());
    setSearchParams(getSearch());
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handler = () => {
      setPath(getPath());
      setSearchParams(getSearch());
    };
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/');
    }
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('popstate', handler);
    };
  }, []);

  return (
    <RouterContext.Provider value={{ path, params, searchParams, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    if (!patternParts.includes('*')) return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    const pathP = pathParts[i];

    if (pp === '*') return params;
    if (pp.startsWith(':')) {
      if (!pathP) return null;
      params[pp.slice(1)] = decodeURIComponent(pathP);
    } else if (pp !== pathP) {
      return null;
    }
  }

  return params;
}

interface RouteConfig {
  path: string;
  element: ReactNode;
}

export function Routes({ children }: { children: ReactNode }) {
  const { path, searchParams, navigate } = useContext(RouterContext);
  const [, setParams] = useState<Record<string, string>>({});

  const routes: RouteConfig[] = [];
  const collectRoutes = (node: ReactNode) => {
    if (!node) return;
    const arr = Array.isArray(node) ? node : [node];
    for (const child of arr) {
      if (!child || typeof child !== 'object' || !('props' in child)) continue;
      const el = child as React.ReactElement<{ path?: string; element?: ReactNode; children?: ReactNode }>;
      if (el.props?.path !== undefined) {
        routes.push({ path: el.props.path, element: el.props.element ?? null });
      }
    }
  };
  collectRoutes(children);

  for (const route of routes) {
    const matched = matchRoute(route.path, path);
    if (matched !== null) {
      return (
        <RouterContext.Provider value={{ path, params: matched, searchParams, navigate }}>
          {route.element}
        </RouterContext.Provider>
      );
    }
  }

  return null;
}

export function Route(_props: { path: string; element?: ReactNode }) {
  return null;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const { navigate } = useContext(RouterContext);
  useEffect(() => { navigate(to, { replace }); }, []);
  return null;
}

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  target?: string;
  rel?: string;
  title?: string;
  style?: React.CSSProperties;
}

export function Link({ to, children, className, onClick, target, rel, title, style }: LinkProps) {
  const { navigate } = useContext(RouterContext);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (target === '_blank') return;
    e.preventDefault();
    onClick?.(e);
    navigate(to);
  };

  return (
    <a
      href={'#' + to}
      className={className}
      onClick={handleClick}
      target={target}
      rel={rel}
      title={title}
      style={style}
    >
      {children}
    </a>
  );
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function useParams<T extends Record<string, string>>(): T {
  const { params } = useContext(RouterContext);
  return params as T;
}

export function useLocation() {
  const { path, searchParams } = useContext(RouterContext);
  return { pathname: path, search: '?' + searchParams.toString() };
}

export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const { searchParams, navigate, path } = useContext(RouterContext);
  const setSearchParams = useCallback((next: URLSearchParams) => {
    const q = next.toString();
    navigate(path + (q ? '?' + q : ''), { replace: true });
  }, [navigate, path]);
  return [searchParams, setSearchParams];
}
