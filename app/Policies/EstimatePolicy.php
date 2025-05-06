<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Estimate;
use Illuminate\Auth\Access\HandlesAuthorization;

class EstimatePolicy
{
    use HandlesAuthorization;

    /**
     * Administrators can do everything.
     */
    public function before(User $user, $ability)
    {
        if ($user->role && $user->role->name === 'admin') {
            return true;
        }
    }

    /**
     * Determine whether the user can view any estimates.
     */
    public function viewAny(User $user): bool
    {
        // Any authenticated admin (caught by before) or manager in their working group?
        return $user->working_group_id !== null;
    }

    /**
     * Determine whether the user can view a given estimate.
     */
    public function view(User $user, Estimate $estimate): bool
    {
        // Must belong to the same working group
        return $user->working_group_id === $estimate->working_group_id;
    }

    /**
     * Determine whether the user can create estimates.
     */
    public function create(User $user): bool
    {
        // Only users assigned to a working group
        return $user->working_group_id !== null;
    }

    /**
     * Determine whether the user can update a given estimate.
     */
    public function update(User $user, Estimate $estimate): bool
    {
        return $user->working_group_id === $estimate->working_group_id
               && in_array($estimate->status, ['draft','pending']);
    }

    /**
     * Determine whether the user can delete a given estimate.
     */
    public function delete(User $user, Estimate $estimate): bool
    {
        return $user->working_group_id === $estimate->working_group_id
               && $estimate->status === 'draft';
    }

    /**
     * Determine whether the user can publish an estimate.
     */
    public function publish(User $user, Estimate $estimate): bool
    {
        return $this->update($user, $estimate);
    }

    /**
     * Determine whether the user can convert an estimate into an order.
     */
    public function convert(User $user, Estimate $estimate): bool
    {
        return $this->view($user, $estimate)
               && $estimate->status === 'published';
    }

    /**
     * Determine whether the user can expire an estimate.
     */
    public function expire(User $user, Estimate $estimate): bool
    {
        return $this->view($user, $estimate)
               && $estimate->status === 'published';
    }
}
