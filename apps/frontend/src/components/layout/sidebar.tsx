'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTabStore } from '@/stores/tab-store';
import {
  Home,
  Search,
  AlertTriangle,
  FileText,
  Wrench,
  Settings,
  MapPin,
  Ruler,
  Users,
  Building2,
  Phone,
  FileStack,
  ClipboardCheck,
  BarChart3,
  Database,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Star,
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  labelEn: string;
  icon?: React.ReactNode;
  href?: string;
  isMvp?: boolean;
  isUiOnly?: boolean;
  children?: MenuItem[];
}

const menuGroups: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    labelEn: 'Dashboard',
    icon: <Home className="h-5 w-5" />,
    href: '/',
    isMvp: true,
  },
  {
    id: 'inspection',
    label: '검사관리',
    labelEn: 'Inspection',
    icon: <Search className="h-5 w-5" />,
    isMvp: true,
    children: [
      { id: 'iqc', label: '수입검사 (IQC)', labelEn: 'IQC', href: '/inspection/iqc', isMvp: true },
      { id: 'ipqc', label: '공정검사 (IPQC)', labelEn: 'IPQC', href: '/inspection/ipqc', isMvp: true },
      { id: 'fqc', label: '최종검사 (FQC)', labelEn: 'FQC', href: '/inspection/fqc', isMvp: true },
      { id: 'oqc', label: '출하검사 (OQC)', labelEn: 'OQC', href: '/inspection/oqc', isMvp: true },
      { id: 'standards', label: '검사기준서 관리', labelEn: 'Inspection Standard', href: '/inspection/standards', isMvp: true },
    ],
  },
  {
    id: 'nonconformance',
    label: '부적합관리',
    labelEn: 'Nonconformance',
    icon: <AlertTriangle className="h-5 w-5" />,
    isMvp: true,
    children: [
      { id: 'ncr', label: 'NCR 관리', labelEn: 'NCR', href: '/nonconformance/ncr', isMvp: true },
      { id: 'mrb', label: 'MRB 관리', labelEn: 'MRB', href: '/nonconformance/mrb', isMvp: true },
      { id: 'disposition', label: '처분관리', labelEn: 'Disposition', href: '/nonconformance/disposition', isMvp: true },
    ],
  },
  {
    id: 'certificate',
    label: '성적서관리',
    labelEn: 'Certificate',
    icon: <FileText className="h-5 w-5" />,
    isMvp: true,
    children: [
      { id: 'issue', label: '성적서발행', labelEn: 'Issue', href: '/certificate/issue', isMvp: true },
      { id: 'template', label: '템플릿관리', labelEn: 'Template', href: '/certificate/template', isMvp: true },
      { id: 'history', label: '발행이력', labelEn: 'History', href: '/certificate/history', isMvp: true },
    ],
  },
  {
    id: 'design-quality',
    label: '개발품질',
    labelEn: 'Design Quality',
    icon: <Wrench className="h-5 w-5" />,
    isMvp: true,
    children: [
      { id: 'apqp', label: 'APQP', labelEn: 'APQP', href: '/design-quality/apqp', isMvp: true },
      { id: 'ppap', label: 'PPAP', labelEn: 'PPAP', href: '/design-quality/ppap', isMvp: true },
      { id: 'dvp', label: 'DVP&R', labelEn: 'DVP&R', href: '/design-quality/dvp', isMvp: true },
      { id: 'fmea', label: 'FMEA', labelEn: 'FMEA', href: '/design-quality/fmea', isUiOnly: true },
      { id: 'msa', label: 'MSA', labelEn: 'MSA', href: '/design-quality/msa', isUiOnly: true },
    ],
  },
  {
    id: 'capa',
    label: 'CAPA',
    labelEn: 'CAPA',
    icon: <Settings className="h-5 w-5" />,
    href: '/capa',
    isMvp: true,
  },
  {
    id: 'traceability',
    label: '추적성',
    labelEn: 'Traceability',
    icon: <MapPin className="h-5 w-5" />,
    href: '/traceability',
    isMvp: true,
  },
  {
    id: 'equipment',
    label: '계측기관리',
    labelEn: 'Equipment',
    icon: <Ruler className="h-5 w-5" />,
    href: '/equipment',
    isMvp: true,
  },
  {
    id: 'hr',
    label: '인적자원',
    labelEn: 'HR',
    icon: <Users className="h-5 w-5" />,
    href: '/hr',
    isMvp: true,
  },
  {
    id: 'supplier',
    label: '공급업체',
    labelEn: 'Supplier',
    icon: <Building2 className="h-5 w-5" />,
    href: '/supplier',
    isMvp: true,
  },
  {
    id: 'field-quality',
    label: '필드품질',
    labelEn: 'Field Quality',
    icon: <Phone className="h-5 w-5" />,
    isMvp: true,
    children: [
      { id: 'complaint', label: '클 레임관리', labelEn: 'Complaint', href: '/field-quality/complaint', isMvp: true },
      { id: 'warranty', label: '보증관리', labelEn: 'Warranty', href: '/field-quality/warranty', isMvp: true },
      { id: 'field-analysis', label: '필드분석', labelEn: 'Field Analysis', href: '/field-quality/field-analysis', isMvp: true },
      { id: 'recall', label: '리콜관리', labelEn: 'Recall', href: '/field-quality/recall', isMvp: true },
    ],
  },
  {
    id: 'documents',
    label: '문서관리',
    labelEn: 'Documents',
    icon: <FileStack className="h-5 w-5" />,
    href: '/documents',
    isUiOnly: true,
  },
  {
    id: 'audit',
    label: '감사관리',
    labelEn: 'Audit',
    icon: <ClipboardCheck className="h-5 w-5" />,
    href: '/audit',
    isUiOnly: true,
  },
  {
    id: 'spc',
    label: 'SPC',
    labelEn: 'SPC',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/spc',
    isUiOnly: true,
  },
  {
    id: 'master-data',
    label: '기준정보',
    labelEn: 'Master Data',
    icon: <Database className="h-5 w-5" />,
    isMvp: true,
    children: [
      { id: 'item', label: '품목관리', labelEn: 'Item', href: '/master-data/item' },
      { id: 'customer', label: '고객관리', labelEn: 'Customer', href: '/master-data/customer' },
      { id: 'supplier-md', label: '공급업체관리', labelEn: 'Supplier', href: '/master-data/supplier' },
      { id: 'code', label: '코드관리', labelEn: 'Code', href: '/master-data/code' },
    ],
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const addTab = useTabStore((s) => s.addTab);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['inspection']);

  /** 메뉴 클릭 시 탭 추가 + 페이지 이동 */
  const handleMenuClick = (item: MenuItem, parentId: string) => {
    if (!item.href) return;
    addTab({
      id: item.id,
      path: item.href,
      label: item.label,
      labelEn: item.labelEn,
      parentId,
    });
    router.push(item.href);
    if (isMobileOpen) onMobileClose();
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isGroupActive = (item: MenuItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isActive(child.href));
    }
    return false;
  };

  const MvpBadge = () => (
    <span className="ml-1.5 inline-flex items-center text-[10px] font-bold text-warning-500" title="MVP">
      <Star className="h-3 w-3 fill-current" />
    </span>
  );

  const UiOnlyBadge = () => (
    <span className="ml-1.5 inline-flex items-center rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-secondary dark:bg-surface-dark">
      UI
    </span>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-background-white dark:bg-background-dark border-r border-border dark:border-border-dark shadow-lg transition-all duration-300 lg:static',
          collapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border dark:border-border-dark px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                Q
              </div>
              <span className="font-bold text-lg text-foreground">QMS</span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold mx-auto">
              Q
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100%-4rem)] overflow-y-auto py-2">
          {menuGroups.map((group) => {
            const groupActive = isGroupActive(group);
            const isExpanded = expandedGroups.includes(group.id);

            if (group.children) {
              return (
                <div key={group.id} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-surface dark:hover:bg-surface-dark',
                      groupActive && 'bg-primary/10 text-primary border border-primary/20',
                      !groupActive && 'text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn('shrink-0', groupActive ? 'text-primary' : 'text-text-secondary')}>
                        {group.icon}
                      </span>
                      {!collapsed && (
                        <span className="flex items-center">
                          {group.label}
                          {group.isMvp && <MvpBadge />}
                          {group.isUiOnly && <UiOnlyBadge />}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border dark:border-border-dark pl-3">
                      {group.children.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleMenuClick(child, group.id)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors text-left',
                              childActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-text-secondary hover:bg-surface dark:hover:bg-surface-dark'
                            )}
                          >
                            <span className="flex items-center">
                              {child.label}
                              {child.isMvp && <MvpBadge />}
                              {child.isUiOnly && <UiOnlyBadge />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={group.id}
                onClick={() => handleMenuClick(group, group.id)}
                className={cn(
                  'mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                  groupActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-foreground hover:bg-surface dark:hover:bg-surface-dark',
                  collapsed && 'justify-center'
                )}
              >
                <span className={cn('shrink-0', groupActive ? 'text-primary' : 'text-text-secondary')}>
                  {group.icon}
                </span>
                {!collapsed && (
                  <span className="flex items-center">
                    {group.label}
                    {group.isMvp && <MvpBadge />}
                    {group.isUiOnly && <UiOnlyBadge />}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
