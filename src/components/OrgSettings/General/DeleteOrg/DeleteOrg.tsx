import React, { useState } from 'react';
import { Button, Card, Modal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { errorHandler } from 'utils/errorHandler';
import { toast } from 'react-toastify';
import {
  DELETE_ORGANIZATION_MUTATION,
  REMOVE_SAMPLE_ORGANIZATION_MUTATION,
} from 'GraphQl/Mutations/mutations';
import DeleteIcon from '@mui/icons-material/Delete';
import { IS_SAMPLE_ORGANIZATION_QUERY } from 'GraphQl/Queries/Queries';
import styles from 'style/app-fixed.module.css';
import { useNavigate, useParams } from 'react-router';
import useLocalStorage from 'utils/useLocalstorage';

/**
 * A component for deleting an organization.
 *
 * It displays a card with a delete button. When the delete button is clicked,
 * a modal appears asking for confirmation. Depending on the type of organization
 * (sample or regular), it performs the delete operation and shows appropriate
 * success or error messages.
 *
 * @returns JSX.Element - The rendered component with delete functionality.
 */
function deleteOrg(): JSX.Element {
  // Translation hook for localization
  const { t } = useTranslation('translation', { keyPrefix: 'deleteOrg' });
  const { t: tCommon } = useTranslation('common');

  // Get the current organization ID from the URL
  const { orgId: currentUrl } = useParams();
  // Navigation hook for redirecting
  const navigate = useNavigate();
  // State to control the visibility of the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Hook for accessing local storage
  const { getItem } = useLocalStorage();
  const canDelete = getItem('SuperAdmin') || true;

  // Check if the user has super admin privileges
  // const canDelete = getItem('SuperAdmin');
  /**
   * Toggles the visibility of the delete confirmation modal.
   */
  const toggleDeleteModal = (): void => setShowDeleteModal(!showDeleteModal);

  // GraphQL mutations for deleting organizations
  const [del] = useMutation(DELETE_ORGANIZATION_MUTATION);
  const [removeSampleOrganization] = useMutation(
    REMOVE_SAMPLE_ORGANIZATION_MUTATION,
  );

  // Query to check if the organization is a sample organization
  const { data } = useQuery(IS_SAMPLE_ORGANIZATION_QUERY, {
    variables: { id: currentUrl },
  });

  /**
   * Deletes the organization. It handles both sample and regular organizations.
   * Displays success or error messages based on the operation result.
   */
  const deleteOrg = async (): Promise<void> => {
    if (data && data.isSampleOrganization) {
      // If it's a sample organization, use a specific mutation
      removeSampleOrganization()
        .then(() => {
          toast.success(t('successfullyDeletedSampleOrganization') as string);
          setTimeout(() => {
            navigate('/orglist');
          }, 1000);
        })
        .catch((error) => {
          toast.error(error.message);
        });
    } else {
      // For regular organizations, use a different mutation
      try {
        await del({ variables: { input: { id: currentUrl || '' } } });
        navigate('/orglist');
      } catch (error) {
        errorHandler(t, error);
      }
    }
  };

  return (
    <>
      {canDelete && (
        <Card className={styles.DeleteOrgCard}>
          <Card.Header className={styles.deleteCardHeader}>
            <h5 className="mb-0 fw-semibold">{t('deleteOrganization')}</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <div className={styles.textBox}>{t('longDelOrgMsg')}</div>
            <Button
              variant="danger"
              className={styles.deleteButton}
              onClick={toggleDeleteModal}
              data-testid="openDeleteModalBtn"
            >
              <DeleteIcon className={styles.icon} />
              {data?.isSampleOrganization
                ? t('deleteSampleOrganization')
                : t('delete')}
            </Button>
          </Card.Body>
        </Card>
      )}
      {/* Delete Organization Modal */}
      {canDelete && (
        <Modal
          show={showDeleteModal}
          onHide={toggleDeleteModal}
          data-testid="orgDeleteModal"
        >
          <Modal.Header className={styles.modelHeaderDelete} closeButton>
            <h5 className="text-white fw-bold">{t('deleteOrganization')}</h5>
          </Modal.Header>
          <Modal.Body>{t('deleteMsg')}</Modal.Body>
          <Modal.Footer>
            <Button
              onClick={toggleDeleteModal}
              data-testid="closeDelOrgModalBtn"
              className={styles.btnDelete}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              className={styles.btnConfirmDelete}
              onClick={deleteOrg}
              data-testid="deleteOrganizationBtn"
            >
              {t('confirmDelete')}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}

export default deleteOrg;
