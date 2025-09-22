import React, { useEffect, useMemo, useState } from 'react'
import { Editor, TLShapeId } from 'tldraw'
import { GameEngine } from '../game/engine'
import type { FeatureTypeId, LoreEntry } from '../game/types'

type ViewMode = 'type' | 'player'
type SidebarAction = 'details' | 'history' | null

const FEATURE_TYPES: Array<{ id: FeatureTypeId; label: string }> = [
  { id: 'npcs', label: 'NPCs' },
  { id: 'monsters', label: 'Monsters' },
  { id: 'magic-items', label: 'Magic Items' },
  { id: 'deities', label: 'Deities' },
  { id: 'locations', label: 'Locations' },
  { id: 'unassigned', label: 'Unassigned' },
]

interface SidebarProps {
  editor: Editor | null
  gameEngine: GameEngine | null
  selectedShapeId: TLShapeId | null
  onSelectFeature: (shapeId: TLShapeId, action?: SidebarAction) => void
  gameStateVersion: number
  activeAction?: SidebarAction
  onActionHandled?: () => void
}

interface FeatureRecord {
  id: TLShapeId
  title: string
  description: string
  lore: string
  playerName: string
  featureType: FeatureTypeId
  season: string
  turn: number
  loreHistory: LoreEntry[]
}

interface TreeNode {
  id: string
  label: string
  description?: string
  playerName?: string
  featureId?: TLShapeId
  children?: TreeNode[]
}

interface TreeStructure {
  nodes: TreeNode[]
  folderIds: string[]
  defaultExpanded: string[]
}

const DEFAULT_CITY_NAME = 'City Name'

function normalizeFeatureType(value: unknown): FeatureTypeId {
  if (!value || typeof value !== 'string') return 'unassigned'
  const normalized = value.toLowerCase()
  const match = FEATURE_TYPES.find(option => option.id === normalized)
  return match ? match.id : 'unassigned'
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item'
}

function buildTypeTree(features: FeatureRecord[]): TreeStructure {
  const folderIds: string[] = []
  const nodes: TreeNode[] = FEATURE_TYPES.map(option => {
    const items = features
      .filter(feature => feature.featureType === option.id)
      .sort((a, b) => a.title.localeCompare(b.title))
    const nodeId = `type:${option.id}`
    folderIds.push(nodeId)
    return {
      id: nodeId,
      label: option.label,
      children: items.map(feature => ({
        id: `feature:${feature.id}`,
        label: feature.title,
        description: feature.description,
        playerName: feature.playerName,
        featureId: feature.id,
      })),
    }
  })

  const defaultExpanded = nodes
    .filter(node => (node.children?.length ?? 0) > 0)
    .map(node => node.id)

  return { nodes, folderIds, defaultExpanded }
}

function buildPlayerTree(features: FeatureRecord[]): TreeStructure {
  const players = new Map<string, FeatureRecord[]>()
  features.forEach(feature => {
    const key = feature.playerName || 'Unknown Adventurer'
    const existing = players.get(key) ?? []
    existing.push(feature)
    players.set(key, existing)
  })

  const folderIds: string[] = []
  const playersList = Array.from(players.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const nodes: TreeNode[] = playersList.map(([playerName, playerFeatures], index) => {
    const playerId = `player:${slugify(`${playerName}-${index}`)}`
    folderIds.push(playerId)
    const typeGroups = new Map<FeatureTypeId, FeatureRecord[]>()
    playerFeatures.forEach(feature => {
      const group = typeGroups.get(feature.featureType) ?? []
      group.push(feature)
      typeGroups.set(feature.featureType, group)
    })

    const children: TreeNode[] = []
    FEATURE_TYPES.forEach(option => {
      const entries = typeGroups.get(option.id)
      if (!entries || entries.length === 0) return
      const sortedEntries = [...entries].sort((a, b) => a.title.localeCompare(b.title))
      const folderId = `${playerId}:${option.id}`
      folderIds.push(folderId)
      children.push({
        id: folderId,
        label: option.label,
        children: sortedEntries.map(feature => ({
          id: `feature:${feature.id}`,
          label: feature.title,
          description: feature.description,
          playerName: feature.playerName,
          featureId: feature.id,
        })),
      })
    })

    return {
      id: playerId,
      label: playerName,
      children,
    }
  })

  const defaultExpanded = nodes
    .filter(node => (node.children?.length ?? 0) > 0)
    .map(node => node.id)

  return { nodes, folderIds, defaultExpanded }
}

function filterTree(nodes: TreeNode[], term: string): TreeNode[] {
  if (!term) return nodes
  const query = term.toLowerCase()

  const filterNode = (node: TreeNode): TreeNode | null => {
    const matchesSelf =
      node.label.toLowerCase().includes(query) ||
      (node.description && node.description.toLowerCase().includes(query)) ||
      (node.playerName && node.playerName.toLowerCase().includes(query))

    if (!node.children || node.children.length === 0) {
      return matchesSelf ? node : null
    }

    const filteredChildren = node.children
      .map(child => filterNode(child))
      .filter((child): child is TreeNode => Boolean(child))

    if (filteredChildren.length > 0 || matchesSelf) {
      return {
        ...node,
        children: filteredChildren,
      }
    }

    return null
  }

  return nodes
    .map(node => filterNode(node))
    .filter((node): node is TreeNode => Boolean(node))
}

function formatSeasonTurn(season: string, turn: number) {
  return `${season} — Turn ${turn}`
}

export const Sidebar: React.FC<SidebarProps> = ({
  editor,
  gameEngine,
  selectedShapeId,
  onSelectFeature,
  gameStateVersion,
  activeAction = null,
  onActionHandled,
}) => {
  const [cityName, setCityName] = useState(DEFAULT_CITY_NAME)
  const [viewMode, setViewMode] = useState<ViewMode>('type')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
  const [activeFeatureId, setActiveFeatureId] = useState<TLShapeId | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'edit'>('overview')
  const [editDescription, setEditDescription] = useState('')
  const [editLore, setEditLore] = useState('')
  const [editFeatureType, setEditFeatureType] = useState<FeatureTypeId>('unassigned')
  const [newLoreEntry, setNewLoreEntry] = useState('')
  const [internalVersion, setInternalVersion] = useState(0)

  useEffect(() => {
    setActiveFeatureId(selectedShapeId)
  }, [selectedShapeId])

  const features = useMemo<FeatureRecord[]>(() => {
    if (!gameEngine) return []
    const builtFeatures = gameEngine.getBuiltFeatures()

    return Object.entries(builtFeatures).map(([shapeId, feature]) => {
      const tlShapeId = shapeId as TLShapeId
      const shape = editor?.getShape(tlShapeId) as { meta?: Record<string, unknown> } | undefined
      const meta = shape?.meta ?? {}
      const name = typeof meta.name === 'string' && meta.name.trim() ? meta.name : null
      const description = feature.description || (typeof meta.description === 'string' ? meta.description : '') || 'No description provided yet.'
      const featureType = feature.featureType ?? normalizeFeatureType(meta.featureType)

      return {
        id: tlShapeId,
        title: name ?? description ?? `Feature ${shapeId}`,
        description,
        lore: feature.lore,
        playerName: feature.playerName,
        featureType,
        season: feature.season,
        turn: feature.turn,
        loreHistory: feature.loreHistory,
      }
    })
  }, [gameEngine, editor, gameStateVersion, internalVersion])

  useEffect(() => {
    if (activeFeatureId && !features.some(feature => feature.id === activeFeatureId)) {
      setActiveFeatureId(null)
    }
  }, [features, activeFeatureId])

  const baseTree: TreeStructure = useMemo(() => {
    return viewMode === 'type' ? buildTypeTree(features) : buildPlayerTree(features)
  }, [features, viewMode])

  const defaultExpandedKey = useMemo(() => baseTree.defaultExpanded.join('|'), [baseTree])

  useEffect(() => {
    setExpandedFolders(new Set(baseTree.defaultExpanded))
  }, [viewMode, defaultExpandedKey])

  const filteredNodes = useMemo(() => filterTree(baseTree.nodes, searchTerm), [baseTree.nodes, searchTerm])

  const expandedSet = useMemo(() => {
    if (searchTerm) return new Set(baseTree.folderIds)
    return expandedFolders
  }, [searchTerm, baseTree.folderIds, expandedFolders])

  const handleToggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectFeature = (featureId: TLShapeId, action: SidebarAction = null) => {
    setIsTemplateMenuOpen(false)
    setActiveFeatureId(featureId)
    onSelectFeature(featureId, action ?? undefined)
  }

  const activeFeature = activeFeatureId ? features.find(feature => feature.id === activeFeatureId) ?? null : null
  const engineFeature = activeFeatureId && gameEngine ? gameEngine.getBuiltFeature(activeFeatureId) : null
  const shape = activeFeatureId && editor ? (editor.getShape(activeFeatureId) as { meta?: Record<string, unknown> } | undefined) : undefined
  const shapeMeta = shape?.meta ?? {}
  const metaDescription = typeof shapeMeta.description === 'string' ? shapeMeta.description : ''
  const metaLore = typeof shapeMeta.lore === 'string' ? shapeMeta.lore : ''
  const metaFeatureType = shapeMeta.featureType

  useEffect(() => {
    if (!activeFeatureId) {
      setEditDescription('')
      setEditLore('')
      setEditFeatureType('unassigned')
      setNewLoreEntry('')
      setActiveSection('overview')
      return
    }

    const feature = engineFeature
    const description = feature?.description ?? metaDescription
    const lore = feature?.lore ?? metaLore
    const type = feature?.featureType ?? normalizeFeatureType(metaFeatureType)

    setEditDescription(description || '')
    setEditLore(lore || '')
    setEditFeatureType(type)
    setNewLoreEntry('')

    if (!feature && activeSection !== 'edit') {
      setActiveSection('edit')
    } else if (feature && activeSection === 'edit') {
      // leave the user in edit mode if they are already editing
    } else if (feature && activeSection !== 'history') {
      setActiveSection('overview')
    }
  }, [activeFeatureId, engineFeature, metaDescription, metaLore, metaFeatureType, internalVersion, gameStateVersion])

  useEffect(() => {
    if (!activeAction || !activeFeatureId) return
    if (activeAction === 'details') {
      setActiveSection('edit')
    } else if (activeAction === 'history') {
      setActiveSection('history')
    }
    onActionHandled?.()
  }, [activeAction, activeFeatureId, onActionHandled])

  const canEdit = Boolean(gameEngine && editor && activeFeatureId)

  const handleSaveDetails = () => {
    if (!gameEngine || !editor || !activeFeatureId) return

    const existing = gameEngine.getBuiltFeature(activeFeatureId)
    const currentPlayer = gameEngine.getCurrentPlayer()
    const playerId = existing?.playerId ?? currentPlayer.id
    const playerName = existing?.playerName ?? currentPlayer.name

    gameEngine.upsertFeature(activeFeatureId, {
      playerId,
      playerName,
      description: editDescription,
      lore: editLore,
      featureType: editFeatureType,
    })

    const shape = editor.getShape(activeFeatureId) as { type: string; meta?: Record<string, unknown> } | undefined
    if (shape) {
      editor.updateShape({
        id: activeFeatureId,
        type: shape.type as any,
        meta: {
          ...(shape.meta ?? {}),
          description: editDescription,
          lore: editLore,
          featureType: editFeatureType,
        },
      })
    }

    setInternalVersion(prev => prev + 1)
    setActiveSection('overview')
  }

  const handleCancelEdit = () => {
    if (!engineFeature) {
      setEditDescription('')
      setEditLore('')
      setEditFeatureType('unassigned')
    } else {
      setEditDescription(engineFeature.description)
      setEditLore(engineFeature.lore)
      setEditFeatureType(engineFeature.featureType)
    }
    setActiveSection(engineFeature ? 'overview' : 'edit')
  }

  const handleAddLoreEntry = () => {
    if (!gameEngine || !activeFeatureId || !newLoreEntry.trim()) return
    gameEngine.addToLoreHistory(activeFeatureId, newLoreEntry.trim())
    setNewLoreEntry('')
    setInternalVersion(prev => prev + 1)
    setActiveSection('history')
  }

  const renderNodes = (nodes: TreeNode[], depth = 0): React.ReactNode => {
    return nodes.map(node => {
      const isFolder = Array.isArray(node.children)
      const hasChildren = (node.children?.length ?? 0) > 0
      const paddingStyle = { paddingLeft: `${depth * 20}px` }

      if (isFolder) {
        const isExpanded = hasChildren ? expandedSet.has(node.id) : false
        return (
          <div key={node.id} className="tree-node tree-node--folder" style={paddingStyle}>
            <div className="tree-node__header">
              <button
                type="button"
                className="tree-node__toggle"
                onClick={() => hasChildren && handleToggleFolder(node.id)}
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-label={hasChildren ? (isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`) : `${node.label} (empty)`}
                disabled={!hasChildren}
              >
                <span className={`tree-node__caret ${isExpanded ? 'is-open' : ''}`} aria-hidden="true" />
              </button>
              <span className="tree-node__icon tree-node__icon--folder" aria-hidden="true" />
              <span className="tree-node__label">{node.label}</span>
            </div>
            {hasChildren && isExpanded && node.children && (
              <div className="tree-node__children">
                {renderNodes(node.children, depth + 1)}
              </div>
            )}
          </div>
        )
      }

      if (!node.featureId) {
        return null
      }

      const isSelected = activeFeatureId === node.featureId
      return (
        <button
          type="button"
          key={node.id}
          className={`tree-node tree-node--feature${isSelected ? ' is-selected' : ''}`}
          style={paddingStyle}
          onClick={() => handleSelectFeature(node.featureId!)}
        >
          <span className="tree-node__icon tree-node__icon--feature" aria-hidden="true" />
          <span className="tree-node__body">
            <span className="tree-node__label">{node.label}</span>
            {node.description && (
              <span className="tree-node__description">{node.description}</span>
            )}
            {node.playerName && (
              <span className="tree-node__meta">Added by {node.playerName}</span>
            )}
          </span>
        </button>
      )
    })
  }

  const featureTypeOptions = FEATURE_TYPES.map(option => (
    <option key={option.id} value={option.id}>
      {option.label}
    </option>
  ))

  return (
    <aside className="game-sidebar">
      <div className="game-sidebar__header">
        <input
          className="city-name-input"
          value={cityName}
          onChange={event => setCityName(event.target.value)}
          aria-label="City name"
        />
        <div className="city-details">
          <button
            type="button"
            className="city-details__trigger"
            onClick={() => setIsDetailsOpen(prev => !prev)}
            aria-expanded={isDetailsOpen}
          >
            Details
            <span className={`city-details__chevron ${isDetailsOpen ? 'is-open' : ''}`} aria-hidden="true" />
          </button>
          {isDetailsOpen && (
            <div className="city-details__panel">
              <h4>City Notes</h4>
              <p>Add overview information about your city, factions, or world hooks.</p>
            </div>
          )}
        </div>
      </div>

      <div className="game-sidebar__controls">
        <div className="view-toggle" role="group" aria-label="Organize features">
          <button
            type="button"
            className={`view-toggle__button${viewMode === 'type' ? ' is-active' : ''}`}
            onClick={() => setViewMode('type')}
          >
            By Feature Type
          </button>
          <button
            type="button"
            className={`view-toggle__button${viewMode === 'player' ? ' is-active' : ''}`}
            onClick={() => setViewMode('player')}
          >
            By Player
          </button>
        </div>
        <div className="game-sidebar__search">
          <input
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search"
            aria-label="Search features"
          />
        </div>
      </div>

      <div className="feature-tree">
        {features.length === 0 ? (
          <div className="feature-tree__empty">No features added yet. Draw on the map and add details to populate this list.</div>
        ) : (
          renderNodes(filteredNodes)
        )}
      </div>

      <div className="feature-detail">
        {activeFeatureId ? (
          <>
            <div className="feature-detail__header">
              <h3>{activeFeature?.title ?? 'New Feature'}</h3>
              {engineFeature && (
                <span className="feature-detail__subhead">
                  {engineFeature.playerName} · {formatSeasonTurn(engineFeature.season, engineFeature.turn)}
                </span>
              )}
            </div>
            <div className="feature-detail__tabs" role="tablist" aria-label="Feature sections">
              <button
                type="button"
                className={`feature-detail__tab${activeSection === 'overview' ? ' is-active' : ''}`}
                onClick={() => setActiveSection('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`feature-detail__tab${activeSection === 'history' ? ' is-active' : ''}`}
                onClick={() => setActiveSection('history')}
              >
                History
              </button>
              <button
                type="button"
                className={`feature-detail__tab${activeSection === 'edit' ? ' is-active' : ''}`}
                onClick={() => setActiveSection('edit')}
              >
                Edit
              </button>
            </div>

            {activeSection === 'overview' && (
              <div className="feature-detail__section">
                <dl className="feature-detail__data">
                  <div className="feature-detail__row">
                    <dt>Type</dt>
                    <dd>{FEATURE_TYPES.find(option => option.id === (engineFeature?.featureType ?? editFeatureType))?.label ?? 'Unassigned'}</dd>
                  </div>
                  <div className="feature-detail__row">
                    <dt>Description</dt>
                    <dd>{engineFeature?.description || editDescription || 'No description yet.'}</dd>
                  </div>
                  <div className="feature-detail__row">
                    <dt>Lore</dt>
                    <dd>{engineFeature?.lore || editLore || 'No lore recorded yet.'}</dd>
                  </div>
                </dl>
              </div>
            )}

            {activeSection === 'history' && (
              <div className="feature-detail__section">
                <div className="feature-detail__history">
                  {engineFeature?.loreHistory.length ? (
                    engineFeature.loreHistory
                      .slice()
                      .sort((a: LoreEntry, b: LoreEntry) => b.timestamp - a.timestamp)
                      .map((entry: LoreEntry) => (
                        <div key={`${entry.timestamp}-${entry.playerId}`} className="feature-detail__history-item">
                          <div className="feature-detail__history-meta">
                            <span className="feature-detail__history-author">{entry.playerName}</span>
                            <span className="feature-detail__history-date">{formatSeasonTurn(entry.season, entry.turn)}</span>
                          </div>
                          <p>{entry.text}</p>
                        </div>
                      ))
                  ) : (
                    <div className="feature-detail__empty">No history entries yet.</div>
                  )}
                </div>
                <div className="feature-detail__history-add">
                  <textarea
                    value={newLoreEntry}
                    onChange={event => setNewLoreEntry(event.target.value)}
                    placeholder="Record a new lore note"
                    rows={3}
                  />
                  <button type="button" onClick={handleAddLoreEntry} disabled={!newLoreEntry.trim()}>
                    Add Entry
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'edit' && (
              <div className="feature-detail__section">
                <div className="feature-detail__form">
                  <label className="feature-detail__field">
                    <span>Feature Type</span>
                    <select value={editFeatureType} onChange={event => setEditFeatureType(event.target.value as FeatureTypeId)}>
                      {featureTypeOptions}
                    </select>
                  </label>
                  <label className="feature-detail__field">
                    <span>Description</span>
                    <textarea
                      value={editDescription}
                      onChange={event => setEditDescription(event.target.value)}
                      rows={3}
                      placeholder="Describe the feature"
                    />
                  </label>
                  <label className="feature-detail__field">
                    <span>Lore</span>
                    <textarea
                      value={editLore}
                      onChange={event => setEditLore(event.target.value)}
                      rows={4}
                      placeholder="Add lore, rumours, or ties"
                    />
                  </label>
                  <div className="feature-detail__actions">
                    <button type="button" className="feature-detail__save" onClick={handleSaveDetails} disabled={!canEdit}>
                      Save Changes
                    </button>
                    <button type="button" className="feature-detail__cancel" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="feature-detail__empty">Select a feature or click one on the map to view its details.</div>
        )}
      </div>

      <div className="game-sidebar__footer">
        <button
          type="button"
          className="game-sidebar__create"
          onClick={() => setIsTemplateMenuOpen(prev => !prev)}
          aria-expanded={isTemplateMenuOpen}
        >
          + Create
        </button>
        {isTemplateMenuOpen && (
          <div className="template-menu">
            <button
              type="button"
              onClick={() => {
                if (selectedShapeId) {
                  handleSelectFeature(selectedShapeId, 'details')
                  setActiveSection('edit')
                }
                setIsTemplateMenuOpen(false)
              }}
              className="template-menu__item"
            >
              Example Template
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
