/**
 * Component: OrganizationActionItems
 *
 * This component renders a table of action items for a specific organization and event.
 * It provides functionality to search, filter, sort, and manage action items.
 *
 * Features:
 * - Fetches action items using GraphQL query based on filters and sorting.
 * - Displays action items in a data grid with columns for assignee, category, status, allotted hours, and due date.
 * - Allows users to create, edit, view, delete, and update the status of action items via modals.
 * - Includes search functionality with debounce for optimized performance.
 * - Provides sorting and filtering options for better data management.
 *
 * Props:
 * - None (Relies on URL parameters for organization and event IDs).
 *
 * State:
 * - `actionItem`: Stores the currently selected action item for modal operations.
 * - `modalMode`: Determines whether the modal is in 'create' or 'edit' mode.
 * - `searchTerm`: Stores the search input value.
 * - `sortBy`: Stores the sorting criteria for due dates.
 * - `status`: Filters action items by their status (Pending, Completed, or Late).
 * - `searchBy`: Determines whether to search by 'assignee' or 'category'.
 * - `modalState`: Tracks the visibility of different modals (Create/Edit, View, Delete, Status Update).
 *
 * Dependencies:
 * - React, React Router, Apollo Client, Material-UI, Bootstrap, Day.js, and custom components.
 *
 * GraphQL:
 * - Query: `ACTION_ITEM_LIST` - Fetches action items based on organization ID, event ID, filters, and sorting.
 *
 * Modals:
 * - `ItemModal`: For creating or editing action items.
 * - `ItemViewModal`: For viewing action item details.
 * - `ItemDeleteModal`: For confirming and deleting action items.
 * - `ItemUpdateStatusModal`: For updating the status of an action item.
 *
 * Error Handling:
 * - Displays an error message if the GraphQL query fails.
 *
 * Loading State:
 * - Displays a loader while fetching data.
 *
 * @returns JSX.Element - The rendered OrganizationActionItems component.
 */
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'react-bootstrap';
import { Navigate, useParams } from 'react-router';

import { Circle, WarningAmberRounded } from '@mui/icons-material';
import dayjs from 'dayjs';

import { useQuery } from '@apollo/client';
import { ACTION_ITEM_LIST } from 'GraphQl/Queries/Queries';

import type {
  InterfaceActionItemInfo,
  InterfaceActionItemList,
} from 'utils/interfaces';
import styles from '../../style/app-fixed.module.css';
import Loader from 'components/Loader/Loader';
import {
  DataGrid,
  type GridCellParams,
  type GridColDef,
} from '@mui/x-data-grid';
import { Chip, debounce, Stack } from '@mui/material';
import ItemViewModal from './itemViewModal/ItemViewModal';
import ItemModal from './itemModal/ItemModal';
import ItemDeleteModal from './itemDeleteModal/ItemDeleteModal';
import Avatar from 'components/Avatar/Avatar';
import ItemUpdateStatusModal from './itemUpdateModal/ItemUpdateStatusModal';
import SortingButton from 'subComponents/SortingButton';
import SearchBar from 'subComponents/SearchBar';

enum ItemStatus {
  Pending = 'pending',
  Completed = 'completed',
  Late = 'late',
}

enum ModalState {
  SAME = 'same',
  DELETE = 'delete',
  VIEW = 'view',
  STATUS = 'status',
}

function organizationActionItems(): JSX.Element {
  const { t } = useTranslation('translation', {
    keyPrefix: 'organizationActionItems',
  });
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');

  // Get the organization ID from URL parameters
  const { orgId, eventId } = useParams();

  if (!orgId) {
    return <Navigate to={'/'} replace />;
  }

  const [actionItem, setActionItem] = useState<InterfaceActionItemInfo | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDate_ASC' | 'dueDate_DESC' | null>(
    null,
  );
  const [status, setStatus] = useState<ItemStatus | null>(null);
  const [searchBy, setSearchBy] = useState<'assignee' | 'category'>('assignee');
  const [modalState, setModalState] = useState<{
    [key in ModalState]: boolean;
  }>({
    [ModalState.SAME]: false,
    [ModalState.DELETE]: false,
    [ModalState.VIEW]: false,
    [ModalState.STATUS]: false,
  });

  const openModal = (modal: ModalState): void =>
    setModalState((prevState) => ({ ...prevState, [modal]: true }));

  const closeModal = (modal: ModalState): void =>
    setModalState((prevState) => ({ ...prevState, [modal]: false }));

  const handleModalClick = useCallback(
    (actionItem: InterfaceActionItemInfo | null, modal: ModalState): void => {
      if (modal === ModalState.SAME) {
        setModalMode(actionItem ? 'edit' : 'create');
      }
      setActionItem(actionItem);
      openModal(modal);
    },
    [openModal],
  );

  /**
   * Query to fetch action items for the organization based on filters and sorting.
   */
  const {
    data: actionItemsData,
    loading: actionItemsLoading,
    error: actionItemsError,
    refetch: actionItemsRefetch,
  }: {
    data: InterfaceActionItemList | undefined;
    loading: boolean;
    error?: Error | undefined;
    refetch: () => void;
  } = useQuery(ACTION_ITEM_LIST, {
    variables: {
      organizationId: orgId,
      eventId: eventId,
      orderBy: sortBy,
      where: {
        assigneeName: searchBy === 'assignee' ? searchTerm : undefined,
        categoryName: searchBy === 'category' ? searchTerm : undefined,
        is_completed:
          status === null ? undefined : status === ItemStatus.Completed,
      },
    },
  });

  const actionItems = useMemo(
    () => actionItemsData?.actionItemsByOrganization || [],
    [actionItemsData],
  );

  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    [],
  );

  // Trigger refetch on sortBy or status change
  useEffect(() => {
    actionItemsRefetch();
  }, [sortBy, status, actionItemsRefetch]);

  if (actionItemsLoading) {
    return <Loader size="xl" />;
  }

  if (actionItemsError) {
    return (
      <div className={styles.message} data-testid="errorMsg">
        <WarningAmberRounded className={styles.icon} fontSize="large" />
        <h6 className="fw-bold text-danger text-center">
          {tErrors('errorLoading', { entity: 'Action Items' })}
        </h6>
      </div>
    );
  }

  const columns: GridColDef[] = [
    {
      field: 'assignee',
      headerName: 'Assignee',
      flex: 1,
      align: 'left',
      minWidth: 100,
      headerAlign: 'center',
      sortable: false,
      headerClassName: `${styles.tableHeader}`,
      renderCell: (params: GridCellParams) => {
        const { _id, firstName, lastName, image } =
          params.row.assigneeUser || params.row.assignee?.user || {};

        return (
          <>
            {params.row.assigneeType !== 'EventVolunteerGroup' ? (
              <>
                <div
                  className="d-flex fw-bold align-items-center ms-2"
                  data-testid="assigneeName"
                >
                  {image ? (
                    <img
                      src={image}
                      alt="Assignee"
                      data-testid={`image${_id + 1}`}
                      className={styles.TableImage}
                    />
                  ) : (
                    <div className={styles.TableImage}>
                      <Avatar
                        key={_id + '1'}
                        containerStyle={styles.imageContainer}
                        avatarStyle={styles.TableImage}
                        name={firstName + ' ' + lastName}
                        alt={firstName + ' ' + lastName}
                      />
                    </div>
                  )}
                  {firstName + ' ' + lastName}
                </div>
              </>
            ) : (
              <>
                <div
                  className="d-flex fw-bold align-items-center ms-2"
                  data-testid="assigneeName"
                >
                  <div className={styles.avatarContainer}>
                    <Avatar
                      key={_id + '1'}
                      containerStyle={styles.imageContainer}
                      avatarStyle={styles.TableImage}
                      name={params.row.assigneeGroup?.name as string}
                      alt={'assigneeGroup_avatar'}
                    />
                  </div>
                  {params.row.assigneeGroup?.name as string}
                </div>
              </>
            )}
          </>
        );
      },
    },
    {
      field: 'itemCategory',
      headerName: 'Item Category',
      flex: 1,
      align: 'center',
      minWidth: 100,
      headerAlign: 'center',
      sortable: false,
      headerClassName: `${styles.tableHeader}`,
      renderCell: (params: GridCellParams) => {
        return (
          <div
            className="d-flex justify-content-center fw-bold"
            data-testid="categoryName"
          >
            {params.row.actionItemCategory?.name}
          </div>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      headerClassName: `${styles.tableHeader}`,
      renderCell: (params: GridCellParams) => {
        return (
          <Chip
            icon={<Circle className={styles.chipIcon} />}
            label={params.row.isCompleted ? 'Completed' : 'Pending'}
            variant="outlined"
            color="primary"
            className={`${styles.chip} ${params.row.isCompleted ? styles.active : styles.pending}`}
          />
        );
      },
    },
    {
      field: 'allottedHours',
      headerName: 'Allotted Hours',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      headerClassName: `${styles.tableHeader}`,
      flex: 1,
      renderCell: (params: GridCellParams) => {
        return (
          <div data-testid="allottedHours">
            {params.row.allottedHours ?? '-'}
          </div>
        );
      },
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      align: 'center',
      headerAlign: 'center',
      sortable: false,
      headerClassName: `${styles.tableHeader}`,
      flex: 1,
      renderCell: (params: GridCellParams) => {
        return (
          <div data-testid="createdOn">
            {dayjs(params.row.dueDate).format('DD/MM/YYYY')}
          </div>
        );
      },
    },
    {
      field: 'options',
      headerName: 'Options',
      align: 'center',
      flex: 1,
      minWidth: 100,
      headerAlign: 'center',
      sortable: false,
      headerClassName: `${styles.tableHeader}`,
      renderCell: (params: GridCellParams) => {
        return (
          <>
            <Button
              // variant="success"
              size="sm"
              style={{ minWidth: '32px' }}
              className={styles.infoButton}
              data-testid={`viewItemBtn${params.row.id}`}
              onClick={() => handleModalClick(params.row, ModalState.VIEW)}
            >
              <i className="fa fa-info" />
            </Button>
            <Button
              variant="success"
              size="sm"
              className={styles.infoButton}
              data-testid={`editItemBtn${params.row.id}`}
              onClick={() => handleModalClick(params.row, ModalState.SAME)}
            >
              <i className="fa fa-edit" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              className={styles.actionItemDeleteButton}
              data-testid={`deleteItemBtn${params.row.id}`}
              onClick={() => handleModalClick(params.row, ModalState.DELETE)}
            >
              <i className="fa fa-trash" />
            </Button>
          </>
        );
      },
    },
    {
      field: 'completed',
      headerName: 'Completed',
      align: 'center',
      flex: 1,
      minWidth: 100,
      headerAlign: 'center',
      sortable: false,
      headerClassName: `${styles.tableHeader}`,
      renderCell: (params: GridCellParams) => {
        return (
          <div className="d-flex align-items-center justify-content-center mt-3">
            <Form.Check
              type="checkbox"
              data-testid={`statusCheckbox${params.row.id}`}
              className={styles.checkboxButton}
              checked={params.row.isCompleted}
              onChange={() => handleModalClick(params.row, ModalState.STATUS)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Header with search, filter  and Create Button */}
      <div className={`${styles.btnsContainer} gap-4 flex-wrap`}>
        <SearchBar
          placeholder={tCommon('searchBy', {
            item: searchBy.charAt(0).toUpperCase() + searchBy.slice(1),
          })}
          onSearch={(value) => {
            debouncedSearch(value);
          }}
          inputTestId="searchBy"
          buttonTestId="searchBtn"
        />
        <div className="d-flex gap-3">
          <SortingButton
            title={tCommon('searchBy')}
            sortingOptions={[
              { label: t('assignee'), value: 'assignee' },
              { label: t('category'), value: 'category' },
            ]}
            selectedOption={t(searchBy)}
            onSortChange={(value) =>
              setSearchBy(value as 'assignee' | 'category')
            }
            dataTestIdPrefix="searchByToggle"
            buttonLabel={tCommon('searchBy', { item: '' })}
            className={styles.dropdown} // Pass a custom class name if needed
          />
          <SortingButton
            title={tCommon('sort')}
            sortingOptions={[
              { label: t('latestDueDate'), value: 'dueDate_DESC' },
              { label: t('earliestDueDate'), value: 'dueDate_ASC' },
            ]}
            selectedOption={t(
              sortBy === 'dueDate_DESC' ? 'latestDueDate' : 'earliestDueDate',
            )}
            onSortChange={(value) =>
              setSortBy(value as 'dueDate_DESC' | 'dueDate_ASC')
            }
            dataTestIdPrefix="sort"
            buttonLabel={tCommon('sort')}
            className={styles.dropdown} // Pass a custom class name if needed
          />
          <SortingButton
            title={t('status')}
            sortingOptions={[
              { label: tCommon('all'), value: 'all' },
              { label: tCommon('pending'), value: ItemStatus.Pending },
              { label: tCommon('completed'), value: ItemStatus.Completed },
            ]}
            selectedOption={t(
              status === null
                ? 'all'
                : status === ItemStatus.Pending
                  ? 'pending'
                  : 'completed',
            )}
            onSortChange={(value) =>
              setStatus(value === 'all' ? null : (value as ItemStatus))
            }
            dataTestIdPrefix="filter"
            buttonLabel={t('status')}
            className={styles.dropdown} // Pass a custom class name if needed
          />
          <Button
            variant="success"
            onClick={() => handleModalClick(null, ModalState.SAME)}
            className={styles.createButton}
            data-testid="createActionItemBtn"
          >
            <i className={'fa fa-plus me-2'} />
            {tCommon('create')}
          </Button>
        </div>
      </div>

      {/* Table with Action Items */}
      <DataGrid
        disableColumnMenu
        disableColumnResize
        columnBufferPx={7}
        hideFooter={true}
        getRowId={(row) => row._id}
        sx={{
          backgroundColor: 'white',
          borderRadius: '16px',
          '& .MuiDataGrid-columnHeaders': { border: 'none' },
          '& .MuiDataGrid-cell': { border: 'none' },
          '& .MuiDataGrid-columnSeparator': { display: 'none' },
        }}
        slots={{
          noRowsOverlay: () => (
            <Stack height="100%" alignItems="center" justifyContent="center">
              {t('noActionItems')}
            </Stack>
          ),
        }}
        getRowClassName={() => `${styles.rowBackground}`}
        autoHeight
        rowHeight={65}
        rows={actionItems.map((actionItem, index) => ({
          id: index + 1,
          ...actionItem,
        }))}
        columns={columns}
        isRowSelectable={() => false}
      />

      {/* Item Modal (Create/Edit) */}
      <ItemModal
        isOpen={modalState[ModalState.SAME]}
        hide={() => closeModal(ModalState.SAME)}
        orgId={orgId}
        eventId={eventId}
        actionItemsRefetch={actionItemsRefetch}
        actionItem={actionItem}
        editMode={modalMode === 'edit'}
      />

      {/* View Modal */}
      {actionItem && (
        <>
          <ItemViewModal
            isOpen={modalState[ModalState.VIEW]}
            hide={() => closeModal(ModalState.VIEW)}
            item={actionItem}
          />

          <ItemUpdateStatusModal
            actionItem={actionItem}
            isOpen={modalState[ModalState.STATUS]}
            hide={() => closeModal(ModalState.STATUS)}
            actionItemsRefetch={actionItemsRefetch}
          />

          <ItemDeleteModal
            isOpen={modalState[ModalState.DELETE]}
            hide={() => closeModal(ModalState.DELETE)}
            actionItem={actionItem}
            actionItemsRefetch={actionItemsRefetch}
          />
        </>
      )}
    </div>
  );
}

export default organizationActionItems;
