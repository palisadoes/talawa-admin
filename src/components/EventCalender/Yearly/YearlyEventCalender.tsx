/**
 * Yearly Event Calendar Component
 *
 * This component renders a yearly calendar view with events displayed
 * for each day. It allows navigation between years and provides
 * functionality to expand and view events for specific days.
 *
 * @component
 * @param {InterfaceCalendarProps} props - The props for the calendar component.
 * @param {InterfaceEvent[]} props.eventData - Array of event data to display.
 * @param {Function} props.refetchEvents - Function to refetch events.
 * @param {InterfaceIOrgList} [props.orgData] - Organization data for filtering events.
 * @param {string} [props.userRole] - Role of the user for access control.
 * @param {string} [props.userId] - ID of the user for filtering events they are attending.
 *
 * @returns {JSX.Element} The rendered yearly calendar component.
 *
 * @remarks
 * - The calendar supports filtering events based on user role, organization data, and user ID.
 * - Events can be expanded to view more details or collapsed for a compact view.
 * - Navigation buttons allow switching between years.
 *
 * @example
 * ```tsx
 * <Calendar
 *   eventData={eventData}
 *   refetchEvents={refetchEvents}
 *   orgData={orgData}
 *   userRole="ADMIN"
 *   userId="12345"
 * />
 * ```
 *
 */
import EventListCard from 'components/EventListCard/EventListCard';
import dayjs from 'dayjs';
import Button from 'react-bootstrap/Button';
import React, { useState, useEffect } from 'react';
import styles from 'style/app-fixed.module.css';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import {
  type InterfaceEvent,
  type InterfaceCalendarProps,
  type InterfaceIOrgList,
  Role,
} from 'types/Event/interface';
import type { User } from 'types/User/type';

const Calendar: React.FC<InterfaceCalendarProps> = ({
  eventData,
  refetchEvents,
  orgData,
  userRole,
  userId,
}) => {
  const [selectedDate] = useState<Date | null>(null);
  const weekdaysShorthand = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<InterfaceEvent[] | null>(null);
  const [expandedY, setExpandedY] = useState<string | null>(null);

  /**
   * Filters events based on user role, organization data, and user ID.
   *
   * @param eventData - Array of event data to filter.
   * @param orgData - Organization data for filtering events.
   * @param userRole - Role of the user for access control.
   * @param userId - ID of the user for filtering events they are attending.
   * @returns Filtered array of event data.
   */
  const filterData = (
    eventData: InterfaceEvent[],
    orgData?: InterfaceIOrgList,
    userRole?: string,
    userId?: string,
  ): InterfaceEvent[] => {
    const data: InterfaceEvent[] = [];
    if (userRole === Role.SUPERADMIN) return eventData;

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
   * Navigates to the previous year.
   */
  const handlePrevYear = (): void => {
    setCurrentYear(currentYear - 1);
  };

  /**
   * Navigates to the next year.
   */
  const handleNextYear = (): void => {
    setCurrentYear(currentYear + 1);
  };

  /**
   * Renders the days of the month for the calendar.
   *
   * @returns Array of JSX elements representing the days of each month.
   */
  const renderMonthDays = (): JSX.Element[] => {
    const renderedMonths: JSX.Element[] = [];

    for (let monthInx = 0; monthInx < 12; monthInx++) {
      const monthStart = new Date(currentYear, monthInx, 1);
      const monthEnd = new Date(currentYear, monthInx + 1, 0);

      const startDate = new Date(monthStart);
      const dayOfWeek = startDate.getDay();
      const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate.setDate(diff);

      const endDate = new Date(monthEnd);
      const endDayOfWeek = endDate.getDay();
      const diffEnd =
        endDate.getDate() + (7 - endDayOfWeek) - (endDayOfWeek === 0 ? 7 : 0);
      endDate.setDate(diffEnd);

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

      const renderedDays = days.map((date, dayIndex) => {
        const className = [
          date.toLocaleDateString() === today.toLocaleDateString()
            ? styles.day__today
            : '',
          date.getMonth() !== monthInx ? styles.day__outside : '',
          selectedDate?.getTime() === date.getTime()
            ? styles.day__selected
            : '',
          styles.day__yearly,
        ].join(' ');

        const eventsForCurrentDate = events?.filter((event) => {
          return dayjs(event.startDate).isSame(date, 'day');
        });

        const renderedEvents =
          eventsForCurrentDate?.map((datas: InterfaceEvent) => {
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

        const toggleExpand = (index: string): void => {
          if (expandedY === index) {
            setExpandedY(null);
          } else {
            setExpandedY(index);
          }
        };

        return (
          <div
            key={`${monthInx}-${dayIndex}`}
            className={className}
            data-testid="day"
          >
            {date.getDate()}
            <div
              className={
                expandedY === `${monthInx}-${dayIndex}`
                  ? styles.expand_list_container
                  : ''
              }
            >
              <div
                className={
                  expandedY === `${monthInx}-${dayIndex}`
                    ? styles.expand_event_list
                    : styles.event_list
                }
              >
                {expandedY === `${monthInx}-${dayIndex}` && renderedEvents}
              </div>
              {renderedEvents && renderedEvents?.length > 0 && (
                <button
                  className={styles.btn__more}
                  onClick={() => toggleExpand(`${monthInx}-${dayIndex}`)}
                >
                  {expandedY === `${monthInx}-${dayIndex}` ? (
                    <div className={styles.closebtnYearlyEventCalender}>
                      <br />
                      <p>Close</p>
                    </div>
                  ) : (
                    <div className={styles.circularButton}></div>
                  )}
                </button>
              )}
              {renderedEvents && renderedEvents?.length == 0 && (
                <button
                  className={styles.btn__more}
                  onClick={() => toggleExpand(`${monthInx}-${dayIndex}`)}
                >
                  {expandedY === `${monthInx}-${dayIndex}` ? (
                    <div className={styles.closebtnYearlyEventCalender}>
                      <br />
                      <br />
                      No Event Available!
                      <br />
                      <p>Close</p>
                    </div>
                  ) : (
                    <div className={styles.circularButton}></div>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      });

      renderedMonths.push(
        <div className={styles.columnYearlyEventCalender} key={monthInx}>
          <div className={styles.cardYearlyEventCalender}>
            <h6 className={styles.cardHeaderYearlyEventCalender}>
              {months[monthInx]}
            </h6>
            <div className={styles.calendar__weekdays}>
              {weekdaysShorthand.map((weekday, index) => (
                <div key={index} className={styles.weekday__yearly}>
                  {weekday}
                </div>
              ))}
            </div>
            <div className={styles.calendar__days}>{renderedDays}</div>
          </div>
        </div>,
      );
    }

    return renderedMonths;
  };

  /**
   * Renders the yearly calendar with navigation buttons.
   *
   * @returns JSX.Element - The rendered yearly calendar component.
   */
  const renderYearlyCalendar = (): JSX.Element => {
    return (
      <div className={styles.yearlyCalendar}>
        <div className={styles.yearlyCalendarHeader}>
          <Button
            className={styles.button}
            onClick={handlePrevYear}
            data-testid="prevYear"
          >
            <ChevronLeft />
          </Button>
          <div className={styles.year}>{currentYear}</div>
          <Button
            className={styles.button}
            onClick={handleNextYear}
            data-testid="nextYear"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className={styles.rowYearlyEventCalender}>
          <div>{renderMonthDays()}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.yearlyCalender}>
        <div>{renderYearlyCalendar()}</div>
      </div>
    </div>
  );
};

export default Calendar;
