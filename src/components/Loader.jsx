import styled, { keyframes } from 'styled-components';

export default function Loader() {
  return (
    <Wrapper>
      <LoaderBox>
        <Square style={{ animationDelay: '0s' }} />
        <Square style={{ animationDelay: '-1.4285714286s' }} />
        <Square style={{ animationDelay: '-2.8571428571s' }} />
        <Square style={{ animationDelay: '-4.2857142857s' }} />
        <Square style={{ animationDelay: '-5.7142857143s' }} />
        <Square style={{ animationDelay: '-7.1428571429s' }} />
        <Square style={{ animationDelay: '-8.5714285714s' }} />
      </LoaderBox>
    </Wrapper>
  );
}

const squareAnimation = keyframes`
  0% { left: 0; top: 0; }
  10.5% { left: 0; top: 0; }
  12.5% { left: 32px; top: 0; }
  23% { left: 32px; top: 0; }
  25% { left: 64px; top: 0; }
  35.5% { left: 64px; top: 0; }
  37.5% { left: 64px; top: 32px; }
  48% { left: 64px; top: 32px; }
  50% { left: 32px; top: 32px; }
  60.5% { left: 32px; top: 32px; }
  62.5% { left: 32px; top: 64px; }
  73% { left: 32px; top: 64px; }
  75% { left: 0; top: 64px; }
  85.5% { left: 0; top: 64px; }
  87.5% { left: 0; top: 32px; }
  98% { left: 0; top: 32px; }
  100% { left: 0; top: 0; }
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
`;

const LoaderBox = styled.div`
  position: relative;
  width: 96px;
  height: 96px;
  transform: rotate(45deg);
`;

const Square = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
  margin: 2px;
  border-radius: 0px;
  background: #2387B6;
  animation: ${squareAnimation} 10s ease-in-out infinite both;
`;
