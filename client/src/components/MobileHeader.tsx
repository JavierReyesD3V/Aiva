import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function MobileHeader({ 
  title, 
  subtitle, 
  children 
}: MobileHeaderProps) {
  const { toggleMobileMenu } = useMobileMenu();
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-dark border-b border-purple-800/30 md:hidden">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
          className="p-2 h-10 w-10 text-white hover:bg-purple-800/30 transition-colors duration-200"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-purple-200">{subtitle}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}