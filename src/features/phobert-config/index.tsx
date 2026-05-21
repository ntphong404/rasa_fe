import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'
import './index.css'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }
type PhobertConfig = Record<string, JsonValue>

type ThemeMode = 'light' | 'dark'

interface ConfigSection {
  id: string
  titleKey: string
  keys: string[]
  autoManaged: boolean
}

const CONFIG_SECTIONS: ConfigSection[] = [
  {
    id: 'general',
    titleKey: 'sections.general',
    keys: [
      'pretrained_model_name_or_path',
      'max_seq_length',
      'pooling_strategy',
      'seed',
      'output_dir',
      'intent_ranking_length',
    ],
    autoManaged: false,
  },
  {
    id: 'training',
    titleKey: 'sections.training',
    keys: [
      'batch_size',
      'learning_rate',
      'epochs',
      'weight_decay',
      'warmup_ratio',
      'gradient_accumulation_steps',
      'use_fp16',
      'use_cosine_schedule',
    ],
    autoManaged: true,
  },
  {
    id: 'finetune',
    titleKey: 'sections.finetune',
    keys: [
      'finetune_epochs',
      'finetune_learning_rate',
      'use_adapters',
      'adapter_size',
      'use_ewc',
      'ewc_lambda',
    ],
    autoManaged: true,
  },
  {
    id: 'regularization',
    titleKey: 'sections.regularization',
    keys: [
      'label_smoothing',
      'use_focal_loss',
      'focal_alpha',
      'focal_gamma',
      'use_multi_sample_dropout',
      'multi_sample_dropout_num',
      'multi_sample_dropout_p',
      'deduplicate_threshold',
    ],
    autoManaged: true,
  },
  {
    id: 'advanced',
    titleKey: 'sections.advanced',
    keys: [
      'use_contrastive',
      'contrastive_temperature',
      'contrastive_weight',
      'temperature_scaling',
      'initial_temperature',
      'val_ratio',
      'early_stopping_patience',
    ],
    autoManaged: true,
  },
]

const ALL_SECTION_KEYS = CONFIG_SECTIONS.flatMap((s) => s.keys)

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getTypeLabel(value: JsonValue): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function jsonStringifyStable(value: JsonValue): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function loadLocalStorage<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
  } catch {
    return fallback
  }
}

function saveLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

export function PhobertConfigPage() {
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | false>(false)
  const [configPath, setConfigPath] = useState<string>('')
  const [originalConfig, setOriginalConfig] = useState<PhobertConfig>({})
  const [draftConfig, setDraftConfig] = useState<PhobertConfig>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [autoTunerHelpOpen, setAutoTunerHelpOpen] = useState(false)

  const apiBaseUrl = useMemo(() => {
    const raw = (import.meta as ImportMeta).env?.VITE_FLASK_API_URL as string | undefined
    const trimmed = (raw || '').trim()
    return trimmed ? trimmed.replace(/\/$/, '') : ''
  }, [])

  const apiUrl = useMemo(() => {
    const path = '/api/phobert-config'
    return apiBaseUrl ? `${apiBaseUrl}${path}` : path
  }, [apiBaseUrl])

  async function resetConfig() {
    if (!window.confirm(t('app.confirmReset', 'Are you sure you want to reset all configurations to defaults?'))) return
    setSaving('reset')
    try {
      const resp = await axiosInstance.post(`${apiUrl}/reset`, {}, {
        headers: { Accept: 'application/json' }
      })
      const data = resp.data
      if (!data || data.code >= 400) {
        throw new Error(data?.message || `Reset failed (${resp.status})`)
      }

      const cfg = data?.result?.config
      if (!isPlainObject(cfg)) {
        throw new Error('Invalid config returned by API after resetting')
      }

      const serverConfig = cfg as PhobertConfig
      setOriginalConfig(serverConfig)
      setDraftConfig(serverConfig)
      setFieldErrors({})
      toast.success(t('app.resetSuccess', 'Config reset to defaults successfully'))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to reset config')
    } finally {
      setSaving(false)
    }
  }

  async function loadConfig() {
    setLoading(true)
    const currentToken = window.localStorage.getItem('authToken')
    if (!currentToken) {
      toast.error(t('Bạn không có quyền truy cập, vui lòng đi từ Web chính'))
      setLoading(false)
      return
    }
    try {
      const resp = await axiosInstance.get(apiUrl, { 
        headers: { Accept: 'application/json' } 
      })
      const data = resp.data
      if (!data || data.code >= 400) {
        throw new Error(data?.message || `Request failed (${resp.status})`)
      }

      const cfg = data?.result?.config
      const path = data?.result?.path
      if (!isPlainObject(cfg)) {
        throw new Error('Invalid config shape returned by API')
      }

      setConfigPath(typeof path === 'string' ? path : '')
      setOriginalConfig(cfg as PhobertConfig)
      setDraftConfig(cfg as PhobertConfig)
      setFieldErrors({})
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  async function saveKeys(keysToSave: string[], label: string) {
    setSaving(label)
    try {
      const updates: PhobertConfig = {}
      for (const key of keysToSave) {
        const oldValue = originalConfig[key]
        const newValue = draftConfig[key]
        if (jsonStringifyStable(oldValue) !== jsonStringifyStable(newValue)) {
          updates[key] = newValue
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        const hasErrorInKeys = keysToSave.some((k) => k in fieldErrors)
        if (hasErrorInKeys) throw new Error('Please fix invalid fields before saving')
      }

      if (Object.keys(updates).length === 0) {
        toast.info(t('app.noChanges'))
        return
      }

      const resp = await axiosInstance.patch(apiUrl, { updates }, {
        headers: { 
          'Content-Type': 'application/json', 
          Accept: 'application/json'
        }
      })
      const data = resp.data
      if (!data || data.code >= 400) {
        throw new Error(data?.message || `Save failed (${resp.status})`)
      }

      const cfg = data?.result?.config
      if (!isPlainObject(cfg)) {
        throw new Error('Invalid config returned by API after saving')
      }

      const serverConfig = cfg as PhobertConfig
      setOriginalConfig(serverConfig)
      // Update draft for saved keys from server, keep unsaved edits intact
      setDraftConfig((prev) => {
        const next = { ...prev }
        for (const key of keysToSave) {
          if (key in serverConfig) next[key] = serverConfig[key]
        }
        return next
      })
      toast.success(t('app.saved'))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to save config')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    void loadConfig()
  }, [])

  const isAutoTuner = draftConfig['isAutoTuner'] === true

  const visibleSections = useMemo(() => {
    if (isAutoTuner) return CONFIG_SECTIONS.filter((s) => !s.autoManaged)
    return CONFIG_SECTIONS
  }, [isAutoTuner])

  // Also show any keys from server that aren't in any section
  const otherKeys = useMemo(() => {
    return Object.keys(draftConfig)
      .filter((k) => k !== 'isAutoTuner' && !ALL_SECTION_KEYS.includes(k))
      .sort()
  }, [draftConfig])

  function sectionHasChanges(keys: string[]): boolean {
    for (const key of keys) {
      if (jsonStringifyStable(originalConfig[key]) !== jsonStringifyStable(draftConfig[key])) return true
    }
    return false
  }

  function autoTunerHasChanges(): boolean {
    return jsonStringifyStable(originalConfig['isAutoTuner']) !== jsonStringifyStable(draftConfig['isAutoTuner'])
  }

  function setFieldValue(key: string, value: JsonValue) {
    setDraftConfig((prev) => ({ ...prev, [key]: value }))
  }

  function setFieldError(key: string, message: string) {
    setFieldErrors((prev) => {
      if (!message) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: message }
    })
  }

  function renderField(key: string) {
    const value = draftConfig[key]
    const fieldError = fieldErrors[key]
    const fieldHelp = t(`fieldHelp.${key}`, { defaultValue: '' }) as string

    return (
      <div key={key} className="row">
        <div className="rowLeft">
          <div className="keyName">{key}</div>
          <div className="keyType">{getTypeLabel(value)}</div>
        </div>
        <div className="rowRight">
          {typeof value === 'string' ? (
            <input className="input" value={value} onChange={(e) => setFieldValue(key, e.target.value)} />
          ) : typeof value === 'number' ? (
            <input
              className="input"
              type="number"
              value={Number.isFinite(value) ? String(value) : ''}
              onChange={(e) => {
                const next = e.target.value
                if (next.trim() === '') {
                  setFieldError(key, 'Number is required')
                  return
                }
                const parsed = Number(next)
                if (Number.isNaN(parsed)) {
                  setFieldError(key, 'Invalid number')
                  return
                }
                setFieldError(key, '')
                setFieldValue(key, parsed)
              }}
            />
          ) : typeof value === 'boolean' ? (
            <label className="toggle">
              <input type="checkbox" checked={value} onChange={(e) => setFieldValue(key, e.target.checked)} />
              <span className="toggleLabel">{value ? t('app.enabled') : t('app.disabled')}</span>
            </label>
          ) : (
            <textarea
              className="textarea"
              value={jsonStringifyStable(value)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value) as JsonValue
                  setFieldError(key, '')
                  setFieldValue(key, parsed)
                } catch {
                  setFieldError(key, 'Invalid JSON')
                }
              }}
              rows={4}
              spellCheck={false}
            />
          )}
          {fieldHelp ? <div className="fieldHelp">{fieldHelp}</div> : null}
          {fieldError ? <div className="fieldError">{fieldError}</div> : null}
        </div>
      </div>
    )
  }

  function renderSection(section: ConfigSection) {
    const availableKeys = section.keys.filter((k) => k in draftConfig)
    if (availableKeys.length === 0) return null

    const changed = sectionHasChanges(availableKeys)
    const isSavingThis = saving === section.id

    return (
      <section key={section.id} className="panel">
        <div className="panelHeader">
          <div className="panelTitleRow">
            <div className="panelTitle">{t(section.titleKey)}</div>
            {section.autoManaged ? <span className="badge">{t('sections.autoManaged')}</span> : null}
            {changed ? <span className="badge badgeChanged">{t('sections.modified')}</span> : null}
          </div>
          <div className="panelActions">
            <button
              type="button"
              className="button buttonPrimary"
              onClick={() => void saveKeys(availableKeys, section.id)}
              disabled={!!saving || !changed}
            >
              {isSavingThis ? t('app.saving') : t('app.save')}
            </button>
          </div>
        </div>
        <div className="grid">{availableKeys.map((key) => renderField(key))}</div>
      </section>
    )
  }

  return (
    <div className="phobertConfigWrapper">


      <main className="appMain">
        <div className="container">

          {loading ? (
            <div className="loading">{t('app.loading')}</div>
          ) : (
            <>
              {/* Auto Tuner */}
              <section className="autoTunerPanel">
                <div className="autoTunerRow">
                  <div className="autoTunerLeft">
                    <div className="autoTunerTitle">{t('autoTuner.title')}</div>
                    <div className="autoTunerDesc">{t('autoTuner.description')}</div>
                  </div>
                  <div className="autoTunerRight">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isAutoTuner}
                        onChange={(e) => setFieldValue('isAutoTuner', e.target.checked)}
                      />
                      <span className="switchTrack">
                        <span className="switchThumb" />
                      </span>
                    </label>
                    <span className="autoTunerStatus">
                      {isAutoTuner ? t('autoTuner.on') : t('autoTuner.off')}
                    </span>
                    <button
                      type="button"
                      className="helpButton"
                      aria-label={t('autoTuner.helpLabel')}
                      onClick={() => setAutoTunerHelpOpen(true)}
                    >
                      ?
                    </button>
                    <button
                      type="button"
                      className="button buttonPrimary buttonSmall"
                      onClick={() => void saveKeys(['isAutoTuner'], 'autoTuner')}
                      disabled={!!saving || !autoTunerHasChanges()}
                    >
                      {saving === 'autoTuner' ? t('app.saving') : t('app.save')}
                    </button>
                  </div>
                </div>
                {isAutoTuner ? (
                  <div className="autoTunerBanner">
                    {t('autoTuner.bannerMsg')}
                  </div>
                ) : null}
              </section>

              {/* Auto-managed sections placeholder when auto is ON */}
              {isAutoTuner ? (
                <section className="panel autoManagedSummary">
                  <div className="autoManagedSummaryInner">
                    <div className="autoManagedSummaryTitle">{t('sections.autoManagedTitle')}</div>
                    <div className="autoManagedSummaryList">
                      {CONFIG_SECTIONS.filter((s) => s.autoManaged).map((s) => (
                        <span key={s.id} className="autoManagedTag">{t(s.titleKey)}</span>
                      ))}
                    </div>
                    <div className="autoManagedSummaryNote">{t('sections.autoManagedNote')}</div>
                  </div>
                </section>
              ) : null}

              {/* Config sections */}
              {visibleSections.map((section) => renderSection(section))}

              {/* Other keys not in any section */}
              {otherKeys.length > 0 ? (
                <section className="panel">
                  <div className="panelHeader">
                    <div className="panelTitle">{t('sections.other')}</div>
                    <div className="panelActions">
                      <button
                        type="button"
                        className="button buttonPrimary"
                        onClick={() => void saveKeys(otherKeys, 'other')}
                        disabled={!!saving || !sectionHasChanges(otherKeys)}
                      >
                        {saving === 'other' ? t('app.saving') : t('app.save')}
                      </button>
                    </div>
                  </div>
                  <div className="grid">{otherKeys.map((key) => renderField(key))}</div>
                </section>
              ) : null}

              {/* Reload */}
              <div className="reloadBar">
                {configPath ? (
                  <span className="metaItem">
                    {t('app.source')}: <code>{configPath}</code>
                  </span>
                ) : null}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="button" onClick={() => void loadConfig()} disabled={!!saving}>
                    {t('app.reload')}
                  </button>
                  <button type="button" className="button buttonDanger" onClick={() => void resetConfig()} disabled={!!saving}>
                    {t('app.reset', 'Reset to Defaults')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Auto Tuner Help Modal */}
        {autoTunerHelpOpen ? (
          <div className="modalOverlay" onClick={() => setAutoTunerHelpOpen(false)}>
            <div className="modalDialog" role="dialog" aria-label="Auto Tuner Help" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <div className="helpTitle">{t('autoTuner.helpTitle')}</div>
                <button type="button" className="modalClose" onClick={() => setAutoTunerHelpOpen(false)}>✕</button>
              </div>
              <div className="modalBody">
                <ul>
                  <li>{t('autoTuner.helpWhat')}</li>
                  <li>{t('autoTuner.helpBatch')}</li>
                  <li>{t('autoTuner.helpEpochs')}</li>
                  <li>{t('autoTuner.helpLR')}</li>
                  <li>{t('autoTuner.helpFocal')}</li>
                  <li>{t('autoTuner.helpContrastive')}</li>
                  <li>{t('autoTuner.helpAdapter')}</li>
                  <li>{t('autoTuner.helpEwc')}</li>
                  <li><b>{t('autoTuner.helpRecommend')}</b></li>
                </ul>
              </div>
            </div>
          </div>
        ) : null}

      </main>


    </div>
  )
}

export default PhobertConfigPage
