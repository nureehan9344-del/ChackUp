import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DataSourceBanner } from './components/DataSourceBanner';
import { FilterBar } from './components/FilterBar';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { ComparativeCharts } from './components/ComparativeCharts';
import { BMIDistribution } from './components/BMIDistribution';
import { Leaderboard } from './components/Leaderboard';
import { IndividualView } from './components/IndividualView';
import { PersonnelTable } from './components/PersonnelTable';
import { WireframeGuideModal } from './components/WireframeGuideModal';
import { AppsScriptCodeModal } from './components/AppsScriptCodeModal';
import { DataImportExportModal } from './components/DataImportExportModal';
import { INITIAL_DATA } from './data/dataset';
import { computeMetricSummaries, buildPersonsFromRecords } from './data/analytics';
import { BodyCompositionRecord, FilterState, PersonSummary, Quarter } from './types';
import {
  loadPersistedState,
  saveCustomState,
  clearCustomState,
  syncDatasetToFirestore,
} from './utils/storage';
import { fetchAllSheetsFromSpreadsheet } from './utils/csvParser';

export default function App() {
  const [records, setRecords] = useState<BodyCompositionRecord[]>(INITIAL_DATA.records);
  const [persons, setPersons] = useState<PersonSummary[]>(INITIAL_DATA.persons);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  // Data source management
  const [dataSourceMode, setDataSourceMode] = useState<'default' | 'custom' | 'sheet_live'>('default');
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Load dataset: First check persisted custom/sheet data in localStorage; if none, fetch default 2,721 personnel dataset
  useEffect(() => {
    let isMounted = true;
    const persisted = loadPersistedState();

    if (persisted.hasCustomData && persisted.records.length > 0) {
      const computedPersons = buildPersonsFromRecords(persisted.records);
      setRecords(persisted.records);
      setPersons(computedPersons);
      setDataSourceMode(persisted.mode);
      setSheetUrl(persisted.sheetUrl);
      setLastSync(persisted.lastSync);
      return;
    }

    // Default mode: Load full 2,721 personnel dataset from /dataset.json
    setIsLoadingData(true);
    fetch('/dataset.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dataset.json');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.records && data.persons) {
          setRecords(data.records);
          setPersons(data.persons);
        }
      })
      .catch((err) => {
        console.warn('Using local fallback dataset:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    viewMode: 'organization',
    selectedQuarter: 'Q3',
    selectedPersonId: null,
    searchQuery: '',
    bmiGroupFilter: 'all',
    completenessFilter: 'all',
    riskFilter: 'all',
  });

  const [isWireframeOpen, setIsWireframeOpen] = useState(false);
  const [isAppsScriptOpen, setIsAppsScriptOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Live Sync directly from Google Sheet (All Sheets / Tabs)
  const handleSyncLiveFromSheet = useCallback(async () => {
    if (!sheetUrl) {
      setIsDataModalOpen(true);
      return;
    }

    setIsSyncingLive(true);
    try {
      const result = await fetchAllSheetsFromSpreadsheet(sheetUrl);

      if (result.records.length > 0) {
        const computed = buildPersonsFromRecords(result.records);
        setRecords(result.records);
        setPersons(computed);
        setDataSourceMode('sheet_live');
        const now = new Date().toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastSync(now);
        saveCustomState(result.records, sheetUrl, 'sheet_live');
        syncDatasetToFirestore(result.records, sheetUrl);
      }
    } catch (err) {
      console.error('Live sync error:', err);
    } finally {
      setIsSyncingLive(false);
    }
  }, [sheetUrl]);

  // Handle imported records (either from CSV file, pasted text, or Google Sheet)
  const handleImportNewRecords = (
    newRecords: BodyCompositionRecord[],
    newSheetUrl?: string,
    mode: 'custom' | 'sheet_live' = 'custom'
  ) => {
    const computedPersons = buildPersonsFromRecords(newRecords);
    setRecords(newRecords);
    setPersons(computedPersons);
    setDataSourceMode(mode);
    if (newSheetUrl !== undefined) {
      setSheetUrl(newSheetUrl);
    }
    const now = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setLastSync(now);

    // Persist immediately in localStorage & Firestore
    saveCustomState(newRecords, newSheetUrl || sheetUrl, mode);
    syncDatasetToFirestore(newRecords, newSheetUrl || sheetUrl);
  };

  // Revert back to default dataset (2,721 personnel)
  const handleResetToDefault = () => {
    clearCustomState();
    setDataSourceMode('default');
    setSheetUrl('');
    setLastSync(null);

    setIsLoadingData(true);
    fetch('/dataset.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.records && data.persons) {
          setRecords(data.records);
          setPersons(data.persons);
        }
      })
      .catch((err) => console.warn(err))
      .finally(() => setIsLoadingData(false));
  };

  // Filter persons based on search & tags
  const filteredPersons = useMemo(() => {
    return persons.filter((p) => {
      // Search by Person ID
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchId = p.person_id.toLowerCase().includes(query);
        if (!matchId) return false;
      }

      // BMI Group Filter
      if (filters.bmiGroupFilter !== 'all' && p.bmiGroup !== filters.bmiGroupFilter) {
        return false;
      }

      // Completeness filter
      if (filters.completenessFilter !== 'all' && p.completeness !== filters.completenessFilter) {
        return false;
      }

      // Risk filter
      if (filters.riskFilter !== 'all') {
        const q3 = p.quarters.Q3 || p.quarters.Q2 || p.quarters.Q1;
        if (filters.riskFilter === 'high_visceral' && (q3?.visceral_fat ?? 0) < 10) return false;
        if (filters.riskFilter === 'high_fat' && (q3?.body_fat_percentage ?? 0) < 30) return false;
        if (filters.riskFilter === 'healthy' && ((q3?.visceral_fat ?? 0) >= 10 || (q3?.body_fat_percentage ?? 0) >= 30)) return false;
      }

      return true;
    });
  }, [persons, filters]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    const validPersonIds = new Set(filteredPersons.map((p) => p.person_id));
    return records.filter((r) => validPersonIds.has(r.person_id));
  }, [records, filteredPersons]);

  // Metric summaries for executive cards
  const metricSummaries = useMemo(() => {
    return computeMetricSummaries(filteredRecords);
  }, [filteredRecords]);

  // Selected person for deep dive
  const selectedPerson = useMemo(() => {
    if (!filters.selectedPersonId) return null;
    return persons.find((p) => p.person_id === filters.selectedPersonId) || null;
  }, [persons, filters.selectedPersonId]);

  const handleSelectPerson = (personId: string | null) => {
    if (personId) {
      setFilters((prev) => ({
        ...prev,
        viewMode: 'individual',
        selectedPersonId: personId,
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        viewMode: 'organization',
        selectedPersonId: null,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-200">
      {/* Top Navigation */}
      <Navbar
        selectedQuarter={filters.selectedQuarter}
        onSelectQuarter={(q) => handleFilterChange({ selectedQuarter: q })}
        onOpenWireframeGuide={() => setIsWireframeOpen(true)}
        onOpenAppsScript={() => setIsAppsScriptOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        totalPersonnel={persons.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Data Source Status Banner */}
        <DataSourceBanner
          mode={dataSourceMode}
          totalPersons={persons.length}
          totalRecords={records.length}
          lastSync={lastSync}
          sheetUrl={sheetUrl}
          isSyncing={isSyncingLive}
          onSyncLive={handleSyncLiveFromSheet}
          onOpenDataModal={() => setIsDataModalOpen(true)}
          onResetToDefault={handleResetToDefault}
        />

        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          persons={persons}
          onSelectPerson={handleSelectPerson}
        />

        {/* Conditional Rendering: Organization Overview vs Individual View */}
        {filters.viewMode === 'individual' && selectedPerson ? (
          <IndividualView
            person={selectedPerson}
            onBackToOverview={() => handleFilterChange({ viewMode: 'organization', selectedPersonId: null })}
          />
        ) : (
          <div className="space-y-8">
            {/* Section 1: Executive Summary */}
            <ExecutiveSummary
              summaries={metricSummaries}
              activeQuarter={filters.selectedQuarter}
              totalPersonnel={filteredPersons.length}
              persons={filteredPersons}
            />

            {/* Section 2: Comparative Charts & Long-term Risk Highlights */}
            <ComparativeCharts
              records={filteredRecords}
              activeQuarter={filters.selectedQuarter}
            />

            {/* Section 3: BMI Distribution & Organizational Trend */}
            <BMIDistribution
              records={filteredRecords}
              persons={filteredPersons}
              activeQuarter={filters.selectedQuarter}
              onSelectPerson={handleSelectPerson}
            />

            {/* Section 4: Individual Leaderboard */}
            <Leaderboard
              persons={filteredPersons}
              onSelectPerson={handleSelectPerson}
            />

            {/* Section 5: Full Personnel Directory Table */}
            <PersonnelTable
              persons={filteredPersons}
              onSelectPerson={handleSelectPerson}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Health &amp; Wellness Body Composition Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsWireframeOpen(true)}
              className="text-indigo-600 hover:underline font-medium"
            >
              Text Wireframe Architecture
            </button>
            <button
              onClick={() => setIsAppsScriptOpen(true)}
              className="text-emerald-700 hover:underline font-medium"
            >
              Google Apps Script Code
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WireframeGuideModal isOpen={isWireframeOpen} onClose={() => setIsWireframeOpen(false)} />
      <AppsScriptCodeModal isOpen={isAppsScriptOpen} onClose={() => setIsAppsScriptOpen(false)} />
      <DataImportExportModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        records={records}
        currentSheetUrl={sheetUrl}
        onImportNewRecords={handleImportNewRecords}
        onResetToDefault={handleResetToDefault}
        mode={dataSourceMode}
      />
    </div>
  );
}
