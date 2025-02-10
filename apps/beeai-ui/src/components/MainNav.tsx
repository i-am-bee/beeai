import Bee from '@/svgs/Bee.svg';
import Discord from '@/svgs/Discord.svg';
import GitHub from '@/svgs/GitHub.svg';
import { Launch } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';

export function MainNav() {
  return (
    <OverflowMenu renderIcon={Bee} size="sm" aria-label="Main navigation" flipped>
      {NAV_ITEMS.map(({ isExternal, itemText, icon, ...props }, idx) => {
        const Icon = icon ? icon : isExternal ? Launch : null;

        return (
          <OverflowMenuItem
            key={idx}
            {...props}
            itemText={
              Icon ? (
                <>
                  <span className="cds--overflow-menu-options__option-content">{itemText}</span> <Icon />
                </>
              ) : (
                itemText
              )
            }
          />
        );
      })}
    </OverflowMenu>
  );
}

// TODO: Add links
const NAV_ITEMS = [
  {
    itemText: 'Settings',
  },
  {
    itemText: 'Documentation',
    isExternal: true,
  },
  {
    itemText: 'GitHub',
    icon: GitHub,
  },
  {
    itemText: 'Discord',
    icon: Discord,
  },
  {
    itemText: 'Terms of Use',
  },
  {
    itemText: 'IBM Privacy Statement',
    isExternal: true,
  },
];
