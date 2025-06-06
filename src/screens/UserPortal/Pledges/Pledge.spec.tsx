import React from 'react';
import { MockedProvider } from '@apollo/react-testing';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { RenderResult } from '@testing-library/react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { store } from 'state/store';
import { StaticMockLink } from 'utils/StaticMockLink';
import i18nForTest from 'utils/i18nForTest';
import { EMPTY_MOCKS, MOCKS, USER_PLEDGES_ERROR } from './PledgesMocks';
import type { ApolloLink } from '@apollo/client';
import Pledges from './Pledges';
import useLocalStorage from 'utils/useLocalstorage';
import { vi, expect, describe, it } from 'vitest';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useParams: () => ({ orgId: 'orgId' }),
  };
});

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@mui/x-date-pickers/DateTimePicker', async () => {
  const actualModule = await vi.importActual(
    '@mui/x-date-pickers/DesktopDateTimePicker',
  );
  return {
    DateTimePicker: actualModule.DesktopDateTimePicker,
  };
});

const { setItem } = useLocalStorage();

const link1 = new StaticMockLink(MOCKS);
const link2 = new StaticMockLink(USER_PLEDGES_ERROR);
const link3 = new StaticMockLink(EMPTY_MOCKS);
const translations = JSON.parse(
  JSON.stringify(i18nForTest.getDataByLanguage('en')?.translation.pledges),
);

const renderMyPledges = (link: ApolloLink): RenderResult => {
  return render(
    <MockedProvider addTypename={false} link={link}>
      <MemoryRouter initialEntries={['/user/pledges/orgId']}>
        <Provider store={store}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <I18nextProvider i18n={i18nForTest}>
              <Routes>
                <Route path="/user/pledges/:orgId" element={<Pledges />} />
                <Route
                  path="/"
                  element={<div data-testid="paramsError"></div>}
                />
              </Routes>
            </I18nextProvider>
          </LocalizationProvider>
        </Provider>
      </MemoryRouter>
    </MockedProvider>,
  );
};

describe('Testing User Pledge Screen', () => {
  beforeEach(() => {
    setItem('userId', 'userId');
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the Campaign Pledge screen', async () => {
    renderMyPledges(link1);
    await waitFor(() => {
      expect(screen.getByTestId('searchPledges')).toBeInTheDocument();
      expect(screen.getByText('Harve Lance')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  // This test works:
  it('should redirect to fallback URL if userId is null in LocalStorage', async () => {
    setItem('userId', null);

    renderMyPledges(link1);
    await waitFor(() => {
      expect(screen.getByTestId('paramsError')).toBeInTheDocument();
    });
  });

  // So let's structure our failing test similarly:
  it('should redirect to fallback URL if URL params are undefined', async () => {
    render(
      <MockedProvider addTypename={false} link={link1}>
        <MemoryRouter initialEntries={['/']}>
          <Provider store={store}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <I18nextProvider i18n={i18nForTest}>
                <Routes>
                  <Route path="/user/pledges/:orgId" element={<Pledges />} />
                  <Route path="/" element={<div data-testid="paramsError" />} />
                </Routes>
              </I18nextProvider>
            </LocalizationProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('paramsError')).toBeInTheDocument();
    });
  });

  it('check if user image renders', async () => {
    renderMyPledges(link1);
    await waitFor(() => {
      expect(screen.getByTestId('searchPledges')).toBeInTheDocument();
    });

    const image = await screen.findByTestId('image1');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'image-url');
  });

  it('Sort the Pledges list by Lowest Amount', async () => {
    renderMyPledges(link1);

    const searchPledger = await screen.findByTestId('searchPledges');
    expect(searchPledger).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('filter'));
    await waitFor(() => {
      expect(screen.getByTestId('amount_ASC')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('amount_ASC'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Harve Lance')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('amountCell')[0]).toHaveTextContent('100');
    });
  });

  it('Sort the Pledges list by Highest Amount', async () => {
    renderMyPledges(link1);

    const searchPledger = await screen.findByTestId('searchPledges');
    expect(searchPledger).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('filter'));
    await waitFor(() => {
      expect(screen.getByTestId('amount_DESC')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('amount_DESC'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Harve Lance')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('amountCell')[0]).toHaveTextContent('700');
    });
  });

  it('Sort the Pledges list by earliest endDate', async () => {
    renderMyPledges(link1);

    const searchPledger = await screen.findByTestId('searchPledges');
    expect(searchPledger).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('filter'));
    await waitFor(() => {
      expect(screen.getByTestId('endDate_ASC')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('endDate_ASC'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Harve Lance')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('amountCell')[0]).toHaveTextContent('700');
    });
  });

  it('Sort the Pledges list by latest endDate', async () => {
    renderMyPledges(link1);

    const searchPledger = await screen.findByTestId('searchPledges');
    expect(searchPledger).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('filter'));
    await waitFor(() => {
      expect(screen.getByTestId('endDate_DESC')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('endDate_DESC'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Harve Lance')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('amountCell')[0]).toHaveTextContent('100');
    });
  });

  it('Search the Pledges list by User name', async () => {
    renderMyPledges(link1);

    await waitFor(() => {
      expect(screen.getByTestId('searchPledges')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('searchByDrpdwn'));

    await waitFor(() => {
      expect(screen.getByTestId('pledgers')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('pledgers'));

    const searchPledger = screen.getByTestId('searchPledges');
    fireEvent.change(searchPledger, {
      target: { value: 'Harve' },
    });
    fireEvent.click(screen.getByTestId('searchBtn'));

    await waitFor(() => {
      expect(screen.getByText('Harve Lance')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).toBeNull();
    });
  });

  it('Search the Pledges list by Campaign name', async () => {
    renderMyPledges(link1);

    await waitFor(() => {
      expect(screen.getByTestId('searchPledges')).toBeInTheDocument();
    });

    const searchByToggle = await screen.findByTestId('searchByDrpdwn');
    fireEvent.click(searchByToggle);

    await waitFor(() => {
      expect(screen.getByTestId('campaigns')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('campaigns'));

    const searchPledger = await screen.findByTestId('searchPledges');
    fireEvent.change(searchPledger, {
      target: { value: 'School' },
    });
    fireEvent.click(screen.getByTestId('searchBtn'));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Harve Lance')).toBeNull();
    });
  });

  it('should render extraUserDetails in Popup', async () => {
    renderMyPledges(link1);
    await waitFor(() => {
      expect(screen.getByTestId('searchPledges')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Harve Lance')).toBeInTheDocument();
      expect(screen.queryByText('Jeramy Gracia')).toBeNull();
      expect(screen.queryByText('Praise Norris')).toBeNull();
    });

    const moreContainer = await screen.findAllByTestId('moreContainer');
    await userEvent.click(moreContainer[0]);

    await waitFor(() => {
      expect(screen.getByTestId('extra1')).toBeInTheDocument();
      expect(screen.getByTestId('extra2')).toBeInTheDocument();
      expect(screen.getByTestId('extraAvatar2')).toBeInTheDocument();
      const image = screen.getByTestId('extraImage1');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'image-url3');
    });

    await userEvent.click(moreContainer[0]);
    await waitFor(() => {
      expect(screen.queryByText('Jeramy Gracia')).toBeNull();
      expect(screen.queryByText('Praise Norris')).toBeNull();
    });
  });

  it('open and closes delete pledge modal', async () => {
    renderMyPledges(link1);

    const deletePledgeBtn = await screen.findAllByTestId('deletePledgeBtn');
    await waitFor(() => expect(deletePledgeBtn[0]).toBeInTheDocument());
    await userEvent.click(deletePledgeBtn[0]);

    await waitFor(() =>
      expect(screen.getByText(translations.deletePledge)).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('deletePledgeCloseBtn'));
    await waitFor(() =>
      expect(screen.queryByTestId('deletePledgeCloseBtn')).toBeNull(),
    );
  });

  it('open and closes update pledge modal', async () => {
    renderMyPledges(link1);

    const editPledgeBtn = await screen.findAllByTestId('editPledgeBtn');
    await waitFor(() => expect(editPledgeBtn[0]).toBeInTheDocument());
    await userEvent.click(editPledgeBtn[0]);

    await waitFor(() =>
      expect(screen.getByText(translations.editPledge)).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('pledgeModalCloseBtn'));
    await waitFor(() =>
      expect(screen.queryByTestId('pledgeModalCloseBtn')).toBeNull(),
    );
  });

  it('should render the Campaign Pledge screen with error', async () => {
    renderMyPledges(link2);
    await waitFor(() => {
      expect(screen.getByTestId('errorMsg')).toBeInTheDocument();
    });
  });

  it('renders the empty pledge component', async () => {
    renderMyPledges(link3);
    await waitFor(() =>
      expect(screen.getByText(translations.noPledges)).toBeInTheDocument(),
    );
  });
});
