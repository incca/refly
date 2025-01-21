import { Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { FC, useEffect, useRef, useState } from 'react';
import { SearchList } from '@refly-packages/ai-workspace-common/modules/entity-selector/components';

import { useImportResourceStoreShallow } from '@refly-packages/ai-workspace-common/stores/import-resource';
import { CanvasNodeType, SearchDomain } from '@refly/openapi-schema';
import { ContextItem } from '@refly-packages/ai-workspace-common/types/context';
import {
  IconAskAI,
  IconCreateDocument,
  IconDocument,
  IconImportResource,
  IconMemo,
  IconResource,
} from '@refly-packages/ai-workspace-common/components/common/icon';
import { genMemoID, genSkillID } from '@refly-packages/utils/id';
import { useAddNode } from '@refly-packages/ai-workspace-common/hooks/canvas/use-add-node';
import { useCreateDocument } from '@refly-packages/ai-workspace-common/hooks/canvas/use-create-document';
import { useReactFlow } from '@xyflow/react';
import { cn } from '@refly-packages/utils/cn';
import { HoverCard, HoverContent } from '@refly-packages/ai-workspace-common/components/hover-card';

// Define toolbar item interface
interface ToolbarItem {
  type: 'button' | 'popover' | 'divider';
  icon?: React.ElementType;
  key?: string;
  domain?: string;
  primary?: boolean;
  danger?: boolean;
  loading?: boolean;
  showSearchList?: boolean;
  setShowSearchList?: (show: boolean) => void;
  hoverContent?: HoverContent;
}

interface MenuPopperProps {
  open: boolean;
  position: { x: number; y: number };
  setOpen: (open: boolean) => void;
}

export const MenuPopper: FC<MenuPopperProps> = ({ open, position, setOpen }) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState<number>(0);
  const { createSingleDocumentInCanvas, isCreating: isCreatingDocument } = useCreateDocument();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const { addNode } = useAddNode();

  const [showSearchResourceList, setShowSearchResourceList] = useState(false);
  const [showSearchDocumentList, setShowSearchDocumentList] = useState(false);

  const { setImportResourceModalVisible, setInsertNodePosition } = useImportResourceStoreShallow((state) => ({
    importResourceModalVisible: state.importResourceModalVisible,
    setImportResourceModalVisible: state.setImportResourceModalVisible,
    setInsertNodePosition: state.setInsertNodePosition,
  }));

  const menuItems: ToolbarItem[] = [
    {
      key: 'askAI',
      icon: IconAskAI,
      type: 'button',
      primary: true,
      hoverContent: {
        title: t('canvas.toolbar.askAI'),
        description: t('canvas.toolbar.askAIDescription'),
        videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
      },
    },
    { key: 'divider-1', type: 'divider' },
    {
      key: 'createDocument',
      icon: IconCreateDocument,
      type: 'button',
      hoverContent: {
        title: t('canvas.toolbar.createDocument'),
        description: t('canvas.toolbar.createDocumentDescription'),
        videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
      },
    },
    {
      key: 'createMemo',
      icon: IconMemo,
      type: 'button',
      hoverContent: {
        title: t('canvas.toolbar.createMemo'),
        description: t('canvas.toolbar.createMemoDescription'),
        videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
      },
    },
    {
      key: 'addResource',
      icon: IconResource,
      type: 'popover',
      domain: 'resource',
      showSearchList: showSearchResourceList,
      setShowSearchList: setShowSearchResourceList,
      hoverContent: {
        title: t('canvas.toolbar.addResource'),
        description: t('canvas.toolbar.addResourceDescription'),
        videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
      },
    },
    {
      key: 'addDocument',
      icon: IconDocument,
      type: 'popover',
      domain: 'document',
      showSearchList: showSearchDocumentList,
      setShowSearchList: setShowSearchDocumentList,
      hoverContent: {
        title: t('canvas.toolbar.addDocument'),
        description: t('canvas.toolbar.addDocumentDescription'),
        videoUrl: 'https://static.refly.ai/static/refly-docs.mp4',
      },
    },
    { key: 'divider-2', type: 'divider' },
    {
      key: 'importResource',
      icon: IconImportResource,
      type: 'button',
      hoverContent: {
        title: t('canvas.toolbar.importResource'),
        description: t('canvas.toolbar.importResourceDescription'),
        videoUrl: 'https://static.refly.ai/static/20250118-182618.mp4',
      },
    },
  ];

  const handleConfirm = (selectedItems: ContextItem[]) => {
    if (selectedItems.length > 0) {
      const domain = selectedItems[0]?.domain;
      selectedItems.forEach((item, index) => {
        const nodePosition = {
          x: position.x + index * 300,
          y: position.y,
        };
        const contentPreview = item?.snippets?.map((snippet) => snippet?.text || '').join('\n');
        addNode({
          type: domain as CanvasNodeType,
          data: { title: item.title, entityId: item.id, contentPreview: item?.contentPreview || contentPreview },
          position: nodePosition,
        });
      });
      setOpen(false);
    }
  };

  const adjustPosition = (x: number, y: number) => {
    const menuWidth = 200;
    const padding = 10;

    // Get window dimensions
    const windowWidth = window?.innerWidth ?? 0;
    const windowHeight = window?.innerHeight ?? 0;

    // Adjust X position if menu would overflow right side
    const adjustedX = Math.min(x, windowWidth - menuWidth - padding);

    // Use actual menu height for calculations
    const adjustedY = Math.min(y, windowHeight - menuHeight - padding);

    return {
      x: Math.max(padding, adjustedX),
      y: Math.max(padding, adjustedY),
    };
  };

  const getMenuScreenPosition = () => {
    const reactFlowInstance = useReactFlow();

    const screenPosition = reactFlowInstance.flowToScreenPosition(position);
    return adjustPosition(screenPosition.x, screenPosition.y);
  };

  const menuScreenPosition = getMenuScreenPosition();

  const createSkillNode = (position: { x: number; y: number }) => {
    addNode({
      type: 'skill',
      data: { title: 'Skill', entityId: genSkillID() },
      position: position,
    });
  };

  const createMemo = (position: { x: number; y: number }) => {
    const memoId = genMemoID();
    addNode({
      type: 'memo',
      data: { title: t('canvas.nodeTypes.memo'), entityId: memoId },
      position: position,
    });
  };

  const handleMenuClick = async ({ key }: { key: string }) => {
    setActiveKey(key);
    switch (key) {
      case 'askAI':
        createSkillNode(position);
        setOpen(false);
        break;
      case 'createDocument':
        await createSingleDocumentInCanvas(position);
        setOpen(false);
        break;
      case 'createMemo':
        createMemo(position);
        setOpen(false);
        break;
      case 'addResource':
        break;
      case 'addDocument':
        break;
      case 'addMemo':
        break;
      case 'addHighlight':
        break;
      case 'importResource':
        setInsertNodePosition(position);
        setImportResourceModalVisible(true);
        setOpen(false);
        break;
    }
  };

  const getIsLoading = (tool: string) => {
    if (tool === 'createDocument' && isCreatingDocument) {
      return true;
    }
    return false;
  };

  // Update menu height when menu opens or content changes
  useEffect(() => {
    if (open && menuRef.current) {
      setMenuHeight(menuRef.current.offsetHeight);
    }
  }, [open, menuItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInsideMenuPopper = menuRef.current?.contains(target);
      const isInsidePopover = target.closest('.canvas-search-list');

      if (open && !isInsideMenuPopper && !isInsidePopover) {
        setOpen(false);
      }
    };

    if (open) {
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      setActiveKey(null);
    };
  }, [open]);

  const renderButton = (item: ToolbarItem) => {
    const button = (
      <Button
        loading={getIsLoading(item.key)}
        className={cn(`w-full px-2 justify-start`, {
          'bg-gray-100': activeKey === item.key,
          'text-primary-600': item.primary,
          'text-red-600': item.danger,
        })}
        type="text"
        icon={<item.icon className="text-base flex items-center" />}
        onClick={() => handleMenuClick({ key: item.key })}
      >
        <span>{t(`canvas.toolbar.${item.key}`)}</span>
      </Button>
    );

    if (item.hoverContent) {
      return (
        <HoverCard
          title={item.hoverContent.title}
          description={item.hoverContent.description}
          videoUrl={item.hoverContent.videoUrl}
          placement="right"
          overlayStyle={{ marginLeft: '12px' }}
          align={{ offset: [12, 0] }}
        >
          {button}
        </HoverCard>
      );
    }

    return button;
  };

  return (
    open && (
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-lg p-2 w-[200px] menu-popper"
        style={{
          left: `${menuScreenPosition.x}px`,
          top: `${menuScreenPosition.y}px`,
        }}
      >
        {menuItems.map((item) => {
          if (item.type === 'button') {
            return (
              <div key={item.key} className="flex items-center w-full">
                {renderButton(item)}
              </div>
            );
          }

          if (item.type === 'popover') {
            return (
              <SearchList
                className="canvas-search-list"
                key={item.key}
                domain={item.domain as SearchDomain}
                handleConfirm={handleConfirm}
                offset={12}
                placement="right"
                open={item.showSearchList}
                setOpen={item.setShowSearchList}
              >
                <div key={item.key} className="flex items-center w-full">
                  {renderButton(item)}
                </div>
              </SearchList>
            );
          }

          if (item.type === 'divider') {
            return <Divider key={item.key} className="my-1 w-full" />;
          }
        })}
      </div>
    )
  );
};
