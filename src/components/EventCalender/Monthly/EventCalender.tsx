/**
 * Calendar Component
 *
 * This component renders a calendar view that supports multiple view types
 * (day, month, and year) and displays events and holidays. It provides
 * navigation between dates and months, and allows users to view event details.
 *
 * @component
 * @param {InterfaceCalendarProps} props - The props for the Calendar component.
 * @param {InterfaceEvent[]} props.eventData - Array of event data to display.
 * @param {() => void} props.refetchEvents - Function to refetch events.
 * @param {InterfaceIOrgList} [props.orgData] - Organization data for filtering events.
 * @param {string} [props.userRole] - Role of the current user (e.g., SUPERADMIN, ADMIN).
 * @param {string} [props.userId] - ID of the current user.
 * @param {ViewType} props.viewType - The current view type (DAY, MONTH, YEAR).
 *
 * @returns {JSX.Element} The rendered Calendar component.
 *
 * @remarks
 * - The component dynamically adjusts its layout based on the screen width.
 * - Events are filtered based on user role and organization data.
 * - Holidays are displayed for the current month.
 *
 * @example
 * ```tsx
 * <Calendar
 *   eventData={events}
 *   refetchEvents={fetchEvents}
 *   orgData={organizationData}
 *   userRole="ADMIN"
 *   userId="12345"
 *   viewType={ViewType.MONTH}
 * />
 * ```
 *
 */
import EventListCard from 'components/EventListCard/EventListCard';
import dayjs from 'dayjs';
import React, { useState, useEffect, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import styles from 'style/app-fixed.module.css';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { ViewType } from 'screens/OrganizationEvents/OrganizationEvents';
import HolidayCard from '../../HolidayCards/HolidayCard';
import { holidays, months, weekdays } from 'types/Event/utils';
import YearlyEventCalender from '../Yearly/YearlyEventCalender';
import type {
  InterfaceEvent,
  InterfaceCalendarProps,
  InterfaceIOrgList,
} from 'types/Event/interface';
import { Role } from 'types/Event/interface';
import { type User } from 'types/User/type';

const Calendar: React.FC<InterfaceCalendarProps> = ({
  eventData,
  refetchEvents,
  orgData,
  userRole,
  userId,
  viewType,
}) => {
  const [selectedDate] = useState<Date | null>(null);
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today.getDate());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<InterfaceEvent[] | null>(null);
  const [expanded, setExpanded] = useState<number>(-1);
  const [windowWidth, setWindowWidth] = useState<number>(window.screen.width);
  useEffect(() => {
    function handleResize(): void {
      setWindowWidth(window.screen.width);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterData = (
    eventData: InterfaceEvent[],
    orgData?: InterfaceIOrgList,
    userRole?: string,
    userId?: string,
  ): InterfaceEvent[] => {
    const data: InterfaceEvent[] = [];
    if (userRole === Role.SUPERADMIN) return eventData;
    // Hard to test all the cases

    if (userRole === Role.ADMIN) {
      eventData?.forEach((event) => {
        if (event.isPublic) data.push(event);
        if (!event.isPublic) {
          const filteredOrg: boolean | undefined = orgData?.admins?.some(
            (data) => data._id === userId,
          );

          if (filteredOrg) {
            data.push(event);
          }
        }
      });
    } else {
      eventData?.forEach((event) => {
        if (event.isPublic) data.push(event);
        const userAttending = event.attendees?.some(
          (data) => data._id === userId,
        );
        if (userAttending) {
          data.push(event);
        }
      });
    }
    return data;
  };

  useEffect(() => {
    const data = filterData(eventData, orgData, userRole, userId);
    setEvents(data);
  }, [eventData, orgData, userRole, userId]);

  /**
   * Moves the calendar view to the previous month.
   */
  const handlePrevMonth = (): void => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const filteredHolidays = useMemo(() => {
    return Array.isArray(holidays)
      ? holidays.filter((holiday) => {
          if (!holiday.date) {
            if (process.env.NODE_ENV !== 'test') {
              console.warn(`Holiday "${holiday.name}" has no date specified.`);
            }
            return false;
          }
          const holidayMonth = dayjs(holiday.date, 'MM-DD', true).month();
          return holidayMonth === currentMonth;
        })
      : [];
  }, [holidays, currentMonth]);

  const handleNextMonth = (): void => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  const handlePrevDate = (): void => {
    if (currentDate > 1) {
      setCurrentDate(currentDate - 1);
    } else {
      if (currentMonth > 0) {
        const lastDayOfPrevMonth = new Date(
          currentYear,
          currentMonth,
          0,
        ).getDate();
        setCurrentDate(lastDayOfPrevMonth);
        setCurrentMonth(currentMonth - 1);
      } else {
        setCurrentDate(31);
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      }
    }
  };

  const handleNextDate = (): void => {
    const lastDayOfCurrentMonth = new Date(
      currentYear,
      currentMonth - 1,
      0,
    ).getDate();
    if (currentDate < lastDayOfCurrentMonth) {
      setCurrentDate(currentDate + 1);
    } else {
      if (currentMonth < 12) {
        setCurrentDate(1);
        setCurrentMonth(currentMonth + 1);
      } else {
        setCurrentDate(1);
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      }
    }
  };

  const handleTodayButton = (): void => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setCurrentDate(today.getDate());
  };

  const timezoneString = `UTC${
    new Date().getTimezoneOffset() > 0 ? '-' : '+'
  }${String(Math.floor(Math.abs(new Date().getTimezoneOffset()) / 60)).padStart(
    2,
    '0',
  )}:${String(Math.abs(new Date().getTimezoneOffset()) % 60).padStart(2, '0')}`;

  const renderHours = (): JSX.Element => {
    const toggleExpand = (index: number): void => {
      if (expanded === index) {
        setExpanded(-1);
      } else {
        setExpanded(index);
      }
    };

    const allDayEventsList: JSX.Element[] =
      events
        ?.filter((datas) => {
          const currDate = new Date(currentYear, currentMonth, currentDate);
          if (datas.startDate == dayjs(currDate).format('YYYY-MM-DD')) {
            return datas;
          }
        })
        .map((datas: InterfaceEvent) => {
          const attendees: Partial<User>[] = [];
          datas.attendees?.forEach((attendee) => {
            const r = { _id: attendee._id };
            attendees.push(r);
          });

          return (
            <EventListCard
              refetchEvents={refetchEvents}
              userRole={userRole}
              key={datas._id}
              _id={datas._id}
              location={datas.location}
              title={datas.title}
              description={datas.description}
              startDate={datas.startDate}
              endDate={datas.endDate}
              startTime={datas.startTime}
              endTime={datas.endTime}
              allDay={datas.allDay}
              recurring={datas.recurring}
              recurrenceRule={datas.recurrenceRule}
              isRecurringEventException={datas.isRecurringEventException}
              isPublic={datas.isPublic}
              isRegisterable={datas.isRegisterable}
              attendees={attendees}
              creator={datas.creator}
            />
          );
        }) || [];

    const shouldShowViewMore =
      allDayEventsList.length > 2 ||
      (windowWidth <= 700 && allDayEventsList.length > 0);

    const handleExpandClick: () => void = () => {
      toggleExpand(-100);
    };

    return (
      <>
        <div className={styles.calendar_hour_block} data-testid="hour">
          <div className={styles.calendar_hour_text_container}>
            <p className={styles.calendar_timezone_text}>{timezoneString}</p>
          </div>
          <div className={styles.dummyWidth}></div>
          <div
            className={
              allDayEventsList?.length > 0
                ? styles.event_list_parent_current
                : styles.event_list_parent
            }
          >
            <div
              className={
                expanded === -100
                  ? styles.expand_list_container
                  : styles.list_container
              }
            >
              <div
                className={
                  expanded === -100
                    ? styles.expand_event_list
                    : styles.event_list_hour
                }
              >
                {Array.isArray(allDayEventsList) &&
                allDayEventsList.length > 0 ? (
                  expanded === -100 ? (
                    allDayEventsList
                  ) : (
                    allDayEventsList.slice(0, 1)
                  )
                ) : (
                  <p className={styles.no_events_message}>
                    No events available
                  </p>
                )}
              </div>
              {Array.isArray(allDayEventsList) && (
                <button
                  className={styles.btn__more}
                  onClick={handleExpandClick}
                >
                  {shouldShowViewMore
                    ? expanded === -100
                      ? 'View less'
                      : 'View all'
                    : null}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.calendar_infocards}>
          <div
            className={styles.holidays_card}
            role="region"
            aria-label="Holidays"
          >
            <h3 className={styles.card_title}>Holidays</h3>
            <ul className={styles.card_list}>
              {filteredHolidays.map((holiday, index) => (
                <li className={styles.card_list_item} key={index}>
                  <span className={styles.holiday_date}>
                    {months[parseInt(holiday.date.slice(0, 2), 10) - 1]}{' '}
                    {holiday.date.slice(3)}
                  </span>
                  <span className={styles.holiday_name}>{holiday.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.events_card} role="region" aria-label="Events">
            <h3 className={styles.card_title}>Events</h3>
            <div className={styles.legend}>
              <div className={styles.eventsLegend}>
                <span className={styles.organizationIndicator}></span>
                <span className={styles.legendText}>
                  Events Created by Organization
                </span>
              </div>
              <div className={styles.list_container_holidays}>
                <span className={styles.holidayIndicator}></span>
                <span className={styles.holidayText}>Holidays</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderDays = (): JSX.Element[] => {
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      monthStart.getDate() - monthStart.getDay(),
    );
    const endDate = new Date(
      monthEnd.getFullYear(),
      monthEnd.getMonth(),
      monthEnd.getDate() + (6 - monthEnd.getDay()),
    );
    const days = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 1,
      );
    }

    return days.map((date, index) => {
      const className = [
        date.getDay() === 0 || date.getDay() === 6 ? styles.day_weekends : '',
        date.toLocaleDateString() === today.toLocaleDateString()
          ? styles.day__today
          : '',
        date.getMonth() !== currentMonth ? styles.day__outside : '',
        selectedDate?.getTime() === date.getTime() ? styles.day__selected : '',
        styles.day,
      ].join(' ');
      const toggleExpand = (index: number): void => {
        if (expanded === index) {
          setExpanded(-1);
        } else {
          setExpanded(index);
        }
      };

      const allEventsList: JSX.Element[] =
        events
          ?.filter((datas) => {
            if (datas.startDate == dayjs(date).format('YYYY-MM-DD'))
              return datas;
          })
          .map((datas: InterfaceEvent) => {
            const attendees: Partial<User>[] = [];
            datas.attendees?.forEach((attendee) => {
              const r = { _id: attendee._id };
              attendees.push(r);
            });

            return (
              <EventListCard
                refetchEvents={refetchEvents}
                userRole={userRole}
                key={datas._id}
                _id={datas._id}
                location={datas.location}
                title={datas.title}
                description={datas.description}
                startDate={datas.startDate}
                endDate={datas.endDate}
                startTime={datas.startTime}
                endTime={datas.endTime}
                allDay={datas.allDay}
                recurring={datas.recurring}
                recurrenceRule={datas.recurrenceRule}
                isRecurringEventException={datas.isRecurringEventException}
                isPublic={datas.isPublic}
                isRegisterable={datas.isRegisterable}
                attendees={attendees}
                creator={datas.creator}
              />
            );
          }) || [];

      const holidayList: JSX.Element[] = filteredHolidays
        .filter((holiday) => holiday.date === dayjs(date).format('MM-DD'))
        .map((holiday) => {
          return <HolidayCard key={holiday.name} holidayName={holiday.name} />;
        });

      return (
        <div
          key={index}
          className={
            className + ' ' + (allEventsList?.length > 0 && styles.day__events)
          }
          data-testid="day"
        >
          {date.getDate()}
          {date.getMonth() !== currentMonth ? null : (
            <div
              className={expanded === index ? styles.expand_list_container : ''}
            >
              <div
                className={
                  expanded === index
                    ? styles.expand_event_list
                    : styles.event_list
                }
              >
                <div>{holidayList}</div>
                {expanded === index
                  ? allEventsList
                  : holidayList?.length > 0
                    ? allEventsList?.slice(0, 1)
                    : allEventsList?.slice(0, 2)}
              </div>
              {(allEventsList?.length > 2 ||
                (windowWidth <= 700 && allEventsList?.length > 0)) && (
                <button
                  className={styles.btn__more}
                  data-testid="more"
                  onClick={() => {
                    toggleExpand(index);
                  }}
                >
                  {expanded === index ? 'View less' : 'View all'}
                </button>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={styles.calendar}>
      {viewType != ViewType.YEAR && (
        <div className={styles.calendar__header}>
          <div className={styles.calender_month}>
            <Button
              variant="outlined"
              className={styles.buttonEventCalendar}
              onClick={
                viewType == ViewType.DAY ? handlePrevDate : handlePrevMonth
              }
              data-testid="prevmonthordate"
            >
              <ChevronLeft />
            </Button>

            <div
              className={styles.calendar__header_month}
              data-testid="current-date"
            >
              {viewType == ViewType.DAY ? `${currentDate}` : ``} {currentYear}{' '}
              <div>{months[currentMonth]}</div>
            </div>
            <Button
              variant="outlined"
              className={styles.buttonEventCalendar}
              onClick={
                viewType == ViewType.DAY ? handleNextDate : handleNextMonth
              }
              data-testid="nextmonthordate"
            >
              <ChevronRight />
            </Button>
          </div>
          <div>
            <Button
              className={styles.editButton}
              onClick={handleTodayButton}
              data-testid="today"
            >
              Today
            </Button>
          </div>
        </div>
      )}
      <div>
        {viewType == ViewType.MONTH ? (
          <>
            <div className={styles.calendar__weekdays}>
              {weekdays.map((weekday, index) => (
                <div key={index} className={styles.weekday}>
                  {weekday}
                </div>
              ))}
            </div>
            <div className={styles.calendar__days}>{renderDays()}</div>
          </>
        ) : viewType == ViewType.YEAR ? (
          <YearlyEventCalender eventData={eventData} />
        ) : (
          <div className={styles.calendar__hours}>{renderHours()}</div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
