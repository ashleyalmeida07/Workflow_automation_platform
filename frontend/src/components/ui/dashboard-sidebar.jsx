import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Settings,
  LogOut,
  Hash,
  ChevronDown,
  ChevronRight,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  X,
  Plus,
  User,
} from 'lucide-react'

// ── Nav Data ────────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    items: [
      { id: 'search', title: 'Search', icon: Search, shortcut: '⌘K' },
      { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
      { id: 'activity', title: 'Activity', icon: Activity },
    ],
  },
  {
    heading: 'Workflows',
    items: [
      {
        id: 'workflows',
        title: 'My Workflows',
        icon: FolderKanban,
        children: [
          { id: 'wf-active', title: 'Active', icon: Hash },
          { id: 'wf-drafts', title: 'Drafts', icon: Hash },
        ],
      },
    ],
  },
]

const BOTTOM_ITEMS = [
  { id: 'profile', title: 'Profile', icon: User, href: '/profile' },
  { id: 'settings', title: 'Settings', icon: Settings, shortcut: '⌘,' },
  { id: 'logout', title: 'Log out', icon: LogOut },
]

// ── WorkspaceSwitcher ────────────────────────────────────────────────────────

function WorkspaceSwitcher({ userName }) {
  const [open, setOpen] = useState(false)
  const initial = userName?.[0]?.toUpperCase() ?? 'F'

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between px-2 py-2 mb-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors select-none group"
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-8 h-8 rounded-lg object-cover shadow-md shadow-orange-500/30" alt="Logo" />
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-medium leading-none mb-1 text-white truncate max-w-[120px]">
              {userName || 'FlowForge'}
            </span>
            <span className="text-[11px] text-white/40 leading-none">Workspace</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" strokeWidth={1.5} />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 py-1 flex flex-col gap-0.5">
            <div className="px-3 py-2 mx-1 text-[13px] rounded-md bg-orange-500/10 text-orange-400 font-medium">
              {userName || 'FlowForge'}
            </div>
            <div className="h-px bg-white/5 my-1 mx-2" />
            <div className="px-3 py-2 mx-1 text-[13px] text-white/50 hover:bg-white/5 rounded-md cursor-pointer flex items-center gap-2 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Create Workspace
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ item, activeId, onSelect, level = 0 }) {
  const isActive = activeId === item.id
  const hasChildren = !!item.children
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleClick = () => {
    if (item.href) { navigate(item.href); return }
    if (hasChildren) { setIsOpen(!isOpen); return }
    onSelect(item.id)
  }

  return (
    <div className="flex flex-col w-full">
      <div
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-150 select-none
          ${isActive
            ? 'bg-orange-500/15 text-orange-400'
            : 'text-white/50 hover:bg-white/5 hover:text-white/90'
          }`}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={`w-[15px] h-[15px] transition-colors ${isActive ? 'text-orange-400' : 'text-white/30 group-hover:text-white/70'}`}
            strokeWidth={1.5}
          />
          <span className="text-[13px] tracking-wide truncate">{item.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-mono text-white/30 bg-white/5 border border-white/10 rounded-[4px]">
              {item.shortcut}
            </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-orange-500/15 text-orange-400">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={`w-3.5 h-3.5 text-white/20 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div
              className="absolute top-0 bottom-0 border-l border-white/5"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children.map(child => (
              <NavItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SidebarNav ────────────────────────────────────────────────────────────────

export function SidebarNav({ activeId, onSelect, userName, onLogout }) {
  return (
    <div className="flex flex-col w-[240px] h-full bg-[#111111] border-r border-white/[0.06] p-3">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
        <img src="/logo.png" className="w-8 h-8 rounded-lg object-cover shadow-md shadow-orange-500/30" alt="Logo" />
      </div>

      <WorkspaceSwitcher userName={userName} />

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
        {NAV_GROUPS.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[10px] font-semibold tracking-widest text-white/25 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map(item => (
              <NavItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom items */}
      <div className="mt-auto pt-3 border-t border-white/[0.06] flex flex-col gap-0.5">
        {BOTTOM_ITEMS.map(item => (
          item.id === 'logout'
            ? (
              <div
                key={item.id}
                onClick={onLogout}
                className="group flex items-center gap-2.5 px-2.5 py-[7px] rounded-[6px] cursor-pointer text-white/40 hover:text-red-400 hover:bg-red-950/30 transition-all duration-150"
              >
                <item.icon className="w-[15px] h-[15px]" strokeWidth={1.5} />
                <span className="text-[13px]">{item.title}</span>
              </div>
            )
            : <NavItem key={item.id} item={item} activeId={activeId} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

// ── SearchModal ───────────────────────────────────────────────────────────────

export function SearchModal({ onClose }) {
  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-sm px-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-white/[0.06]">
          <Search className="w-[17px] h-[17px] text-white/30 mr-3 shrink-0" strokeWidth={1.5} />
          <input
            autoFocus
            className="flex-1 bg-transparent py-4 outline-none text-[14px] text-white placeholder:text-white/30"
            placeholder="Search workflows, settings, or actions..."
          />
          <kbd
            onClick={onClose}
            className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-mono text-white/30 bg-white/5 border border-white/10 rounded-[4px] cursor-pointer hover:text-white transition-colors"
          >
            ESC
          </kbd>
          <button onClick={onClose} className="ml-3 p-1 rounded-md text-white/30 hover:bg-white/10 hover:text-white transition-colors">
            <X className="w-[17px] h-[17px]" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-2 py-10 flex flex-col items-center justify-center">
          <Command className="w-6 h-6 text-white/20 mb-2" strokeWidth={1.5} />
          <p className="text-[13px] text-white/30 font-medium">Type to search...</p>
        </div>
      </div>
    </div>
  )
}

// ── DashboardLayout ───────────────────────────────────────────────────────────

export function DashboardLayout({ activeId, onSelect, userName, onLogout, children, breadcrumb }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleSelect = (id) => {
    if (id === 'search') { setSearchOpen(true); return }
    onSelect?.(id)
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Sidebar */}
      <div
        className={`h-full shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[240px] opacity-100' : 'w-0 opacity-0'}`}
      >
        <SidebarNav
          activeId={activeId}
          onSelect={handleSelect}
          userName={userName}
          onLogout={onLogout}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="h-12 border-b border-white/[0.06] flex items-center px-4 justify-between bg-[#111111] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md text-white/30 hover:bg-white/5 hover:text-white transition-colors"
            >
              {sidebarOpen
                ? <PanelLeftClose className="w-[17px] h-[17px]" strokeWidth={1.5} />
                : <PanelLeftOpen className="w-[17px] h-[17px]" strokeWidth={1.5} />
              }
            </button>
            {breadcrumb && (
              <div className="flex items-center gap-2 text-sm text-white/30">
                <span>FlowForge</span>
                <span>/</span>
                <span className="text-white/80 font-medium">{breadcrumb}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 w-56 h-8 px-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] rounded-lg text-[13px] text-white/30 transition-colors"
            >
              <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Search...</span>
              <kbd className="ml-auto text-[10px] font-mono">⌘K</kbd>
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xs font-bold">
              {userName?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </div>
      </div>

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
