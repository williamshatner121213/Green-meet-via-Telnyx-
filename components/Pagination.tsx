import React, { useState } from 'react';
import { ReactElement } from 'react';
import { useEffect } from 'react';
import { Button } from 'grommet';
import { FormNext, FormPrevious } from 'grommet-icons';
import styled from 'styled-components';

const breakpointMedium = 1023;

const Container = styled.div<{ viewType: string }>`
  display: flex;
  width: 100%;
  justify-content: space-between;
  margin-bottom: 20px;

  ${(props) =>
    props.viewType === 'screen-sharing'
      ? `@media (max-width: ${breakpointMedium}px) {
      display: none;
    }`
      : null}

  @media (max-width: ${breakpointMedium}px) {
    margin-bottom: 0px;
  }
`;

export function Pagination({
  data,
  dataLimit,
  RenderComponent,
  viewType = 'grid',
  layoutProps,
}: {
  data: Array<ReactElement>;
  dataLimit: number;
  RenderComponent: Function;
  viewType: 'grid' | 'screen-sharing';
  layoutProps?: any;
}) {
  const [pages, setPages] = useState(Math.ceil(data.length / dataLimit));
  const [currentPage, setCurrentPage] = useState(1);

  //Reset current page when change layout view "mobile|tblet|desktop"
  useEffect(() => {
    if (pages === 1) {
      setCurrentPage(1);
    }
  }, [pages]);

  //Set the quantity of pages
  useEffect(() => {
    setPages(Math.ceil(data.length / dataLimit));
  }, [data, dataLimit]);

  function goToNextPage() {
    setCurrentPage((page) => page + 1);
  }

  function goToPreviousPage() {
    setCurrentPage((page) => page - 1);
  }

  const getPaginatedData = () => {
    const startIndex = currentPage * dataLimit - dataLimit;
    const endIndex = startIndex + dataLimit;
    return data.slice(startIndex, endIndex);
  };

  return (
    <div>
      {pages > 1 && (
        <Container viewType={viewType}>
          {/* previous button */}
          <Button
            size='small'
            style={{
              borderRadius: '50%',
              backgroundColor: '#cecece',
            }}
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            primary
            icon={<FormPrevious />}
            hoverIndicator
          ></Button>

          {/* next button */}
          <Button
            size='small'
            style={{
              borderRadius: '50%',
              backgroundColor: '#cecece',
            }}
            onClick={goToNextPage}
            disabled={currentPage === pages}
            primary
            icon={<FormNext />}
            hoverIndicator
          ></Button>
        </Container>
      )}
      <RenderComponent {...layoutProps}>{getPaginatedData()}</RenderComponent>
    </div>
  );
}
