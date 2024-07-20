import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/D3 Force Layout/i);
  expect(linkElement).toBeInTheDocument();
});
